import type {
  CourseOutcomeCode,
  SectionCourseOutcomeMappingState,
  SpreadsheetColumn,
} from "@/types/course-review";

export const COURSE_OUTCOME_CODES: CourseOutcomeCode[] = ["CO1", "CO2", "CO3"];

export function createEmptySectionMapping(): SectionCourseOutcomeMappingState {
  return {
    CO1: "",
    CO2: "",
    CO3: "",
  };
}

export function getPrioritizedAssessmentColumns(
  columns: SpreadsheetColumn[],
  coCode: CourseOutcomeCode,
) {
  const groupedColumns = columns.filter(
    (column) => column.assessmentGroup === coCode,
  );
  const otherColumns = columns.filter(
    (column) => column.assessmentGroup !== coCode,
  );

  return {
    groupedColumns,
    otherColumns,
  };
}

export function getMissingMappingCodes(
  mapping: SectionCourseOutcomeMappingState,
) {
  return COURSE_OUTCOME_CODES.filter((coCode) => mapping[coCode].length === 0);
}

export function updateSectionMapping(
  mapping: SectionCourseOutcomeMappingState,
  coCode: CourseOutcomeCode,
  columnKey: string,
) {
  return {
    ...mapping,
    [coCode]: columnKey,
  };
}
