import * as XLSX from "xlsx";
import type {
  CourseOutcomeCode,
  ParsedSection,
  SpreadsheetCellValue,
  SpreadsheetColumn,
  SpreadsheetRow,
} from "@/types/course-review";

type WorksheetRow = SpreadsheetCellValue[];

type ParseSpreadsheetBufferOptions = {
  id: string;
  fileName: string;
  sectionName: string;
  data: ArrayBuffer | Uint8Array;
};

const METADATA_COLUMN_LABELS = new Set([
  "last name",
  "first name",
  "username",
  "student id",
  "last access",
  "availability",
]);

const TOTAL_POINTS_PATTERN = /\[Total Pts:\s*([^\]]+)\]/i;
const GRADE_CENTER_ID_PATTERN = /\|(\d+)\s*$/;
const COURSE_OUTCOME_BOUNDARY_PATTERN = /^CO\s*([1-3])\s+Grade\b/i;
const FINAL_GRADE_PATTERN = /\bfinal\s+grade\b/i;
const BYTE_ORDER_MARK_PATTERN = /^\uFEFF/;

export async function parseSpreadsheetFile(
  uploadedFile: File,
  options: Omit<ParseSpreadsheetBufferOptions, "data" | "fileName">,
) {
  const data = await uploadedFile.arrayBuffer();

  return parseSpreadsheetBuffer({
    ...options,
    data,
    fileName: uploadedFile.name,
  });
}

export function parseSpreadsheetBuffer({
  id,
  fileName,
  sectionName,
  data,
}: ParseSpreadsheetBufferOptions): ParsedSection {
  const rows = readRows(data);
  const headerRowIndex = findHeaderRowIndex(rows);

  if (headerRowIndex < 0) {
    throw new Error("No header row was found in the spreadsheet.");
  }

  const headerRow = rows[headerRowIndex] ?? [];
  const studentRows = rows.slice(headerRowIndex + 1).filter(hasAnyValue);
  const columns = createColumns(headerRow);
  const rowsByColumn = createRows(studentRows, columns, headerRowIndex);

  return {
    id,
    fileName,
    sectionName,
    columns,
    rows: rowsByColumn,
    headerRowIndex,
    assessmentColumns: columns.filter((column) => column.isPossibleAssessment),
    courseOutcomeBoundaries: columns.filter(
      (column) => column.isCourseOutcomeBoundary,
    ),
  };
}

function readRows(data: ArrayBuffer | Uint8Array): WorksheetRow[] {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);

  try {
    return readRowsWithSheetJs(bytes);
  } catch {
    return readRowsFromDelimitedText(bytes);
  }
}

function readRowsWithSheetJs(bytes: Uint8Array): WorksheetRow[] {
  const workbook = XLSX.read(bytes, {
    cellDates: true,
    raw: true,
    type: "array",
  });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    return [];
  }

  return XLSX.utils.sheet_to_json<SpreadsheetCellValue[]>(
    workbook.Sheets[firstSheetName],
    {
      blankrows: false,
      defval: null,
      header: 1,
      raw: true,
    },
  );
}

function readRowsFromDelimitedText(bytes: Uint8Array): WorksheetRow[] {
  const text = decodeSpreadsheetText(bytes);
  const delimiter = text.includes("\t") ? "\t" : ",";

  return text
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) =>
      line.split(delimiter).map((cell) => parseCellValue(cell.trim())),
    );
}

function decodeSpreadsheetText(bytes: Uint8Array) {
  if (bytes[0] === 0xff && bytes[1] === 0xfe) {
    return new TextDecoder("utf-16le").decode(bytes);
  }

  if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    return new TextDecoder("utf-16be").decode(bytes);
  }

  return new TextDecoder("utf-8").decode(bytes);
}

function parseCellValue(value: string): SpreadsheetCellValue {
  if (value.length === 0) {
    return null;
  }

  const numericValue = Number(value);

  if (Number.isFinite(numericValue) && value.match(/^-?\d+(?:\.\d+)?$/)) {
    return numericValue;
  }

  return value;
}

function findHeaderRowIndex(rows: WorksheetRow[]) {
  return rows.findIndex((row) => row.filter(hasCellValue).length >= 2);
}

function createColumns(headerRow: WorksheetRow): SpreadsheetColumn[] {
  const preliminaryColumns = headerRow.map((header, index) => {
    const rawHeader = normalizeHeader(header);
    const label = getDisplayLabel(rawHeader);
    const courseOutcomeCode = getCourseOutcomeBoundaryCode(label);
    const totalPointsLabel = getTotalPointsLabel(rawHeader);
    const totalPoints = getTotalPoints(totalPointsLabel);

    return {
      key: `column_${index}`,
      label,
      index,
      rawHeader,
      gradeCenterId: getGradeCenterId(rawHeader),
      totalPointsLabel,
      totalPoints,
      isCourseOutcomeBoundary: Boolean(courseOutcomeCode),
      courseOutcomeCode,
      isPossibleAssessment: false,
    } satisfies SpreadsheetColumn;
  });

  const boundaryIndexes = getBoundaryIndexes(preliminaryColumns);

  return preliminaryColumns.map((column) => ({
    ...column,
    isPossibleAssessment: isPossibleAssessmentColumn(column),
    assessmentGroup: getAssessmentGroup(column.index, boundaryIndexes),
  }));
}

function createRows(
  studentRows: WorksheetRow[],
  columns: SpreadsheetColumn[],
  headerRowIndex: number,
): SpreadsheetRow[] {
  return studentRows.map((row, rowIndex) => {
    const cells = columns.reduce<Record<string, SpreadsheetCellValue>>(
      (currentCells, column) => ({
        ...currentCells,
        [column.key]: row[column.index] ?? null,
      }),
      {},
    );

    return {
      id: `row_${headerRowIndex + rowIndex + 1}`,
      rowIndex: headerRowIndex + rowIndex + 1,
      cells,
      isValidStudent: isValidStudentRow(cells, columns),
    };
  });
}

function normalizeHeader(header: SpreadsheetCellValue) {
  return String(header ?? "")
    .replace(BYTE_ORDER_MARK_PATTERN, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getDisplayLabel(header: string) {
  return header
    .replace(TOTAL_POINTS_PATTERN, "")
    .replace(GRADE_CENTER_ID_PATTERN, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getTotalPointsLabel(header: string) {
  return header.match(TOTAL_POINTS_PATTERN)?.[1]?.trim();
}

function getTotalPoints(totalPointsLabel?: string) {
  if (!totalPointsLabel) {
    return undefined;
  }

  const totalPoints = Number(totalPointsLabel.match(/\d+(?:\.\d+)?/)?.[0]);

  return Number.isFinite(totalPoints) ? totalPoints : undefined;
}

function getGradeCenterId(header: string) {
  return header.match(GRADE_CENTER_ID_PATTERN)?.[1];
}

function getCourseOutcomeBoundaryCode(
  label: string,
): CourseOutcomeCode | undefined {
  const courseOutcomeNumber = label.match(COURSE_OUTCOME_BOUNDARY_PATTERN)?.[1];

  if (!courseOutcomeNumber) {
    return undefined;
  }

  return `CO${courseOutcomeNumber}` as CourseOutcomeCode;
}

function isPossibleAssessmentColumn(column: SpreadsheetColumn) {
  if (!column.totalPointsLabel) {
    return false;
  }

  if (column.isCourseOutcomeBoundary || FINAL_GRADE_PATTERN.test(column.label)) {
    return false;
  }

  return !METADATA_COLUMN_LABELS.has(column.label.toLowerCase());
}

function getBoundaryIndexes(columns: SpreadsheetColumn[]) {
  return columns.reduce<Partial<Record<CourseOutcomeCode, number>>>(
    (currentIndexes, column) => {
      if (column.courseOutcomeCode) {
        return {
          ...currentIndexes,
          [column.courseOutcomeCode]: column.index,
        };
      }

      return currentIndexes;
    },
    {},
  );
}

function getAssessmentGroup(
  columnIndex: number,
  boundaryIndexes: Partial<Record<CourseOutcomeCode, number>>,
): CourseOutcomeCode | undefined {
  const co1Index = boundaryIndexes.CO1;
  const co2Index = boundaryIndexes.CO2;
  const co3Index = boundaryIndexes.CO3;

  if (co1Index !== undefined && columnIndex < co1Index) {
    return "CO1";
  }

  if (
    co1Index !== undefined &&
    co2Index !== undefined &&
    columnIndex > co1Index &&
    columnIndex < co2Index
  ) {
    return "CO2";
  }

  if (
    co2Index !== undefined &&
    co3Index !== undefined &&
    columnIndex > co2Index &&
    columnIndex < co3Index
  ) {
    return "CO3";
  }

  return undefined;
}

function isValidStudentRow(
  cells: Record<string, SpreadsheetCellValue>,
  columns: SpreadsheetColumn[],
) {
  const metadataColumns = columns.filter((column) =>
    METADATA_COLUMN_LABELS.has(column.label.toLowerCase()),
  );

  return metadataColumns.some((column) => hasCellValue(cells[column.key]));
}

function hasAnyValue(row: WorksheetRow) {
  return row.some(hasCellValue);
}

function hasCellValue(value: SpreadsheetCellValue | undefined) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}
