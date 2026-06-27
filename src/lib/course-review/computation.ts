import type {
  CourseOutcomeCode,
  CourseOutcomeRemark,
  CourseReviewResult,
  CourseReviewValidationError,
  OutcomeResult,
  ParsedSection,
  SectionCourseOutcomeMappingState,
  SectionResult,
  SpreadsheetCellValue,
  SpreadsheetColumn,
  SpreadsheetRow,
} from "@/types/course-review";
import {
  COURSE_OUTCOME_CODES,
  getMissingMappingCodes,
} from "@/lib/course-review/mapping";

const DEFAULT_MIN_SATISFACTORY_PERCENT = 70;
const DEFAULT_TARGET_PASSED_PERCENT = 70;

type ComputeCourseReviewResultOptions = {
  parsedSections: ParsedSection[];
  mappingsBySectionId: Record<string, SectionCourseOutcomeMappingState>;
  courseCode?: string;
  courseTitle?: string;
  academicYear?: string;
  quarter?: string;
};

export function getNumericScore(value: SpreadsheetCellValue | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmedValue = value.trim();

    if (trimmedValue.length === 0) {
      return null;
    }

    const numericValue = Number(trimmedValue);

    return Number.isFinite(numericValue) ? numericValue : null;
  }

  return null;
}

export function countPassedStudents(
  rows: SpreadsheetRow[],
  column: SpreadsheetColumn,
  minSatisfactoryPercent = DEFAULT_MIN_SATISFACTORY_PERCENT,
) {
  const passingScore = getPassingScore(column, minSatisfactoryPercent);

  return rows.filter((row) => {
    const score = getNumericScore(row.cells[column.key]);

    return score !== null && score >= passingScore;
  }).length;
}

export function computePercentagePassed(
  frequencyPassed: number,
  totalStudents: number,
) {
  if (totalStudents <= 0) {
    return 0;
  }

  return roundToTwoDecimals((frequencyPassed / totalStudents) * 100);
}

export function computeRemarks(
  percentagePassed: number,
  targetPassedPercent = DEFAULT_TARGET_PASSED_PERCENT,
): CourseOutcomeRemark {
  return percentagePassed >= targetPassedPercent ? "PASSED" : "FAILED";
}

export function computeOutcomeResult({
  coCode,
  column,
  rows,
  minSatisfactoryPercent = DEFAULT_MIN_SATISFACTORY_PERCENT,
  targetPassedPercent = DEFAULT_TARGET_PASSED_PERCENT,
}: {
  coCode: CourseOutcomeCode;
  column: SpreadsheetColumn;
  rows: SpreadsheetRow[];
  minSatisfactoryPercent?: number;
  targetPassedPercent?: number;
}): OutcomeResult {
  const frequencyPassed = countPassedStudents(
    rows,
    column,
    minSatisfactoryPercent,
  );
  const percentagePassed = computePercentagePassed(
    frequencyPassed,
    rows.length,
  );

  return {
    coCode,
    assessmentTask: column.label,
    minSatisfactoryPercent,
    targetPassedPercent,
    frequencyPassed,
    percentagePassed,
    remarks: computeRemarks(percentagePassed, targetPassedPercent),
    recommendation: "",
  };
}

export function computeSectionResult(
  parsedSection: ParsedSection,
  mapping: SectionCourseOutcomeMappingState,
): SectionResult {
  const validRows = parsedSection.rows.filter((row) => row.isValidStudent);
  const outcomes = COURSE_OUTCOME_CODES.flatMap((coCode) => {
    const columnKey = mapping[coCode];

    if (!columnKey) {
      return [];
    }

    const column = parsedSection.assessmentColumns.find(
      (assessmentColumn) => assessmentColumn.key === columnKey,
    );

    if (!column) {
      throw new Error(`${coCode} mapping is missing or invalid.`);
    }

    return [
      computeOutcomeResult({
        coCode,
        column,
        rows: validRows,
      }),
    ];
  });

  return {
    id: parsedSection.id,
    sectionName: parsedSection.sectionName,
    fileName: parsedSection.fileName,
    totalStudents: validRows.length,
    outcomes,
  };
}

export function computeCourseReviewResult({
  parsedSections,
  mappingsBySectionId,
  courseCode = "",
  courseTitle = "",
  academicYear = "",
  quarter = "",
}: ComputeCourseReviewResultOptions): CourseReviewResult {
  const validationErrors = validateCourseReviewComputation({
    parsedSections,
    mappingsBySectionId,
  });

  if (validationErrors.length > 0) {
    throw new Error(validationErrors.map((error) => error.message).join("\n"));
  }

  return {
    courseCode,
    courseTitle,
    academicYear,
    quarter,
    sections: parsedSections.map((parsedSection) =>
      computeSectionResult(parsedSection, mappingsBySectionId[parsedSection.id]),
    ),
  };
}

export function validateCourseReviewComputation({
  parsedSections,
  mappingsBySectionId,
}: Omit<ComputeCourseReviewResultOptions, "courseCode">) {
  const errors: CourseReviewValidationError[] = [];

  if (parsedSections.length === 0) {
    errors.push({
      message: "At least one parsed section is required before computation.",
    });
  }

  parsedSections.forEach((parsedSection) => {
    if (parsedSection.sectionName.trim().length === 0) {
      errors.push({
        sectionId: parsedSection.id,
        message: "Section name is required before computation.",
      });
    }

    const validRows = parsedSection.rows.filter((row) => row.isValidStudent);

    if (validRows.length === 0) {
      errors.push({
        sectionId: parsedSection.id,
        message: `${parsedSection.sectionName} has no valid student rows.`,
      });
    }

    const mapping = mappingsBySectionId[parsedSection.id];

    if (!mapping) {
      errors.push({
        sectionId: parsedSection.id,
        message: `${parsedSection.sectionName} is missing CO mappings.`,
      });
      return;
    }

    getMissingMappingCodes(mapping).forEach((coCode) => {
      errors.push({
        sectionId: parsedSection.id,
        coCode,
        message: `${parsedSection.sectionName} ${coCode} mapping is required.`,
      });
    });

    COURSE_OUTCOME_CODES.forEach((coCode) => {
      const columnKey = mapping[coCode];

      if (!columnKey) {
        return;
      }

      const column = parsedSection.assessmentColumns.find(
        (assessmentColumn) => assessmentColumn.key === columnKey,
      );

      if (!column) {
        errors.push({
          sectionId: parsedSection.id,
          coCode,
          message: `${parsedSection.sectionName} ${coCode} selected column was not found.`,
        });
        return;
      }

      if (!hasNumericScore(validRows, column)) {
        errors.push({
          sectionId: parsedSection.id,
          coCode,
          message: `${parsedSection.sectionName} ${coCode} selected column has no numeric scores.`,
        });
      }
    });
  });

  return errors;
}

function getPassingScore(
  column: SpreadsheetColumn,
  minSatisfactoryPercent: number,
) {
  if (isPercentageColumn(column) || column.totalPoints === undefined) {
    return minSatisfactoryPercent;
  }

  return column.totalPoints * (minSatisfactoryPercent / 100);
}

function isPercentageColumn(column: SpreadsheetColumn) {
  return column.totalPointsLabel?.toLowerCase().includes("percentage") ?? false;
}

function hasNumericScore(rows: SpreadsheetRow[], column: SpreadsheetColumn) {
  return rows.some((row) => getNumericScore(row.cells[column.key]) !== null);
}

function roundToTwoDecimals(value: number) {
  return Math.round(value * 100) / 100;
}
