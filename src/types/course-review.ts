export type CourseOutcomeCode = "CO1" | "CO2" | "CO3";

export type CourseOutcomeRemark = "PASSED" | "FAILED";

export type SpreadsheetCellValue = string | number | boolean | Date | null;

export type SpreadsheetParseStatus = "idle" | "parsing" | "parsed" | "failed";

export type UploadedSpreadsheetFile = {
  id: string;
  file: File;
  fileName: string;
  sectionName: string;
};

export type SpreadsheetColumn = {
  key: string;
  label: string;
  index: number;
  isPossibleAssessment: boolean;
  rawHeader?: string;
  gradeCenterId?: string;
  totalPointsLabel?: string;
  totalPoints?: number;
  isCourseOutcomeBoundary?: boolean;
  courseOutcomeCode?: CourseOutcomeCode;
  assessmentGroup?: CourseOutcomeCode;
};

export type SpreadsheetRow = {
  id: string;
  rowIndex: number;
  cells: Record<string, SpreadsheetCellValue>;
  isValidStudent: boolean;
};

export type ParsedSection = {
  id: string;
  fileName: string;
  sectionName: string;
  columns: SpreadsheetColumn[];
  rows: SpreadsheetRow[];
  headerRowIndex: number;
  assessmentColumns: SpreadsheetColumn[];
  courseOutcomeBoundaries: SpreadsheetColumn[];
};

export type CourseOutcomeMapping = {
  coCode: CourseOutcomeCode;
  columnKey: string;
};

export type SectionCourseOutcomeMappings = {
  sectionId: string;
  mappings: CourseOutcomeMapping[];
};

export type SectionCourseOutcomeMappingState = Record<
  CourseOutcomeCode,
  string
>;

export type OutcomeResult = {
  coCode: CourseOutcomeCode;
  assessmentTask: string;
  minSatisfactoryPercent: number;
  targetPassedPercent: number;
  frequencyPassed: number;
  percentagePassed: number;
  remarks: CourseOutcomeRemark;
  recommendation: "";
};

export type SectionResult = {
  id: string;
  sectionName: string;
  fileName: string;
  totalStudents: number;
  outcomes: OutcomeResult[];
};

export type CourseReviewResult = {
  courseCode: string;
  courseTitle?: string;
  academicYear?: string;
  quarter?: string;
  dateOfReview?: string;
  sections: SectionResult[];
};

export type CourseReviewReportDetails = {
  courseCode: string;
  dateOfReview: string;
  courseTitle: string;
  academicYear: string;
  quarter: string;
};

export type CourseReviewValidationError = {
  sectionId?: string;
  coCode?: CourseOutcomeCode;
  message: string;
};
