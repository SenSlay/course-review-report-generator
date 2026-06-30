const EXCEL_EXTENSION_PATTERN = /\.(xlsx|xls)$/i;
const TRAILING_EXPORT_TOKEN_PATTERN =
  /(?:[_\s-]+(?:fullgc|fullgradecenter|gradecenter|export))$/i;
const COURSE_CODE_PATTERN = /^[a-z]+\d{3,}(?:-\d+)?$/i;
const REPORT_METADATA_PATTERN = /(?:^|[_\s-])([1-4]T)(\d{4})(?=[_\s.-]|$)/i;
const REPORT_METADATA_TOKEN_PATTERN = /^[1-4]T\d{4}$/i;
const EXPORT_TOKEN_PATTERN = /^(fullgc|fullgradecenter|gradecenter|export)$/i;
const TIMESTAMP_TOKEN_PATTERN = /^\d{4}-\d{2}-\d{2}(?:-\d{2}){0,3}$/;

function normalizeFileName(fileName: string) {
  return fileName
    .trim()
    .replace(EXCEL_EXTENSION_PATTERN, "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isReportFileMetadataToken(token: string) {
  return (
    REPORT_METADATA_TOKEN_PATTERN.test(token) ||
    EXPORT_TOKEN_PATTERN.test(token) ||
    TIMESTAMP_TOKEN_PATTERN.test(token)
  );
}

export function inferCourseCodeFromFileName(fileName: string) {
  const normalizedName = normalizeFileName(fileName);
  const courseCode = normalizedName
    .split(" ")
    .find((token) => COURSE_CODE_PATTERN.test(token));

  return courseCode ?? "";
}

export function inferReportMetadataFromFileName(fileName: string) {
  const match = fileName.match(REPORT_METADATA_PATTERN);

  if (!match) {
    return {
      academicYear: "",
      quarter: "",
    };
  }

  const [, quarter, academicYearCode] = match;
  const startYear = academicYearCode.slice(0, 2);
  const endYear = academicYearCode.slice(2, 4);

  return {
    academicYear: `20${startYear}-20${endYear}`,
    quarter: quarter.toUpperCase(),
  };
}

export function inferSectionNameFromFileName(fileName: string) {
  const normalizedName = normalizeFileName(fileName);
  const tokens = normalizedName.split(" ");
  const courseCodeIndex = tokens.findIndex((token) =>
    COURSE_CODE_PATTERN.test(token),
  );

  if (courseCodeIndex >= 0) {
    const tokensAfterCourseCode = tokens.slice(courseCodeIndex + 1);
    const metadataTokenIndex = tokensAfterCourseCode.findIndex((token) =>
      isReportFileMetadataToken(token),
    );
    const sectionName = (
      metadataTokenIndex >= 0
        ? tokensAfterCourseCode.slice(0, metadataTokenIndex)
        : tokensAfterCourseCode
    )
      .join(" ")
      .trim();

    if (sectionName) {
      return sectionName;
    }
  }

  return normalizedName.replace(TRAILING_EXPORT_TOKEN_PATTERN, "").trim();
}
