const EXCEL_EXTENSION_PATTERN = /\.(xlsx|xls)$/i;
const TRAILING_EXPORT_TOKEN_PATTERN =
  /(?:[_\s-]+(?:fullgc|fullgradecenter|gradecenter|export))$/i;
const COURSE_CODE_PATTERN = /^[a-z]+\d{3,}(?:-\d+)?$/i;
const SECTION_CODE_PATTERN = /^[a-z]{2,}\d{2,}[a-z0-9-]*$/i;

function normalizeFileName(fileName: string) {
  return fileName
    .trim()
    .replace(EXCEL_EXTENSION_PATTERN, "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isSectionCodeToken(token: string) {
  return SECTION_CODE_PATTERN.test(token) && !COURSE_CODE_PATTERN.test(token);
}

export function inferCourseCodeFromFileName(fileName: string) {
  const normalizedName = normalizeFileName(fileName);
  const courseCode = normalizedName
    .split(" ")
    .find((token) => COURSE_CODE_PATTERN.test(token));

  return courseCode ?? "";
}

export function inferSectionNameFromFileName(fileName: string) {
  const normalizedName = normalizeFileName(fileName);
  const tokens = normalizedName.split(" ");
  const courseCodeIndex = tokens.findIndex((token) =>
    COURSE_CODE_PATTERN.test(token),
  );

  if (courseCodeIndex >= 0) {
    const sectionCode = tokens
      .slice(courseCodeIndex + 1)
      .find((token) => isSectionCodeToken(token));

    if (sectionCode) {
      return sectionCode;
    }
  }

  const sectionCode = tokens.find((token) => isSectionCodeToken(token));

  if (sectionCode) {
    return sectionCode;
  }

  return normalizedName.replace(TRAILING_EXPORT_TOKEN_PATTERN, "").trim();
}
