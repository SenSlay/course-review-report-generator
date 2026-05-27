import { describe, expect, it } from "vitest";
import type {
  ParsedSection,
  SpreadsheetColumn,
  SpreadsheetRow,
} from "@/types/course-review";
import {
  computeCourseReviewResult,
  computePercentagePassed,
  computeRemarks,
  countPassedStudents,
  validateCourseReviewComputation,
} from "./computation";

describe("course review computation", () => {
  it("treats blank scores as failed while keeping students in the denominator", () => {
    const column = createColumn("activity", "Activity 1", 100);
    const rows = [
      createRow("row-1", { activity: 70 }),
      createRow("row-2", { activity: "" }),
      createRow("row-3", { activity: 100 }),
    ];

    expect(countPassedStudents(rows, column)).toBe(2);
    expect(computePercentagePassed(2, rows.length)).toBe(66.67);
  });

  it("computes PASSED and FAILED remarks from target percentage", () => {
    expect(computeRemarks(70)).toBe("PASSED");
    expect(computeRemarks(69.99)).toBe("FAILED");
  });

  it("computes a section result using selected CO mappings", () => {
    const parsedSection = createParsedSection();
    const result = computeCourseReviewResult({
      parsedSections: [parsedSection],
      mappingsBySectionId: {
        section_1: {
          CO1: "co1",
          CO2: "co2",
          CO3: "co3",
        },
      },
    });

    expect(result.sections[0].outcomes).toEqual([
      expect.objectContaining({
        coCode: "CO1",
        frequencyPassed: 2,
        percentagePassed: 66.67,
        remarks: "FAILED",
        recommendation: "",
      }),
      expect.objectContaining({
        coCode: "CO2",
        frequencyPassed: 3,
        percentagePassed: 100,
        remarks: "PASSED",
      }),
      expect.objectContaining({
        coCode: "CO3",
        frequencyPassed: 0,
        percentagePassed: 0,
        remarks: "FAILED",
      }),
    ]);
  });

  it("validates missing mappings before computation", () => {
    const errors = validateCourseReviewComputation({
      parsedSections: [createParsedSection()],
      mappingsBySectionId: {
        section_1: {
          CO1: "co1",
          CO2: "",
          CO3: "",
        },
      },
    });

    expect(errors.map((error) => error.coCode)).toEqual(["CO2", "CO3"]);
  });

  it("validates selected columns with no numeric scores", () => {
    const parsedSection = createParsedSection([
      createRow("row-1", { co1: "N/A", co2: 90, co3: 80 }),
    ]);
    const errors = validateCourseReviewComputation({
      parsedSections: [parsedSection],
      mappingsBySectionId: {
        section_1: {
          CO1: "co1",
          CO2: "co2",
          CO3: "co3",
        },
      },
    });

    expect(errors).toEqual([
      expect.objectContaining({
        coCode: "CO1",
        message: "FOPM01 CO1 selected column has no numeric scores.",
      }),
    ]);
  });
});

function createParsedSection(rows = createRows()): ParsedSection {
  const assessmentColumns = [
    createColumn("co1", "CO1 Activity", 100),
    createColumn("co2", "CO2 Activity", 100),
    createColumn("co3", "CO3 Activity", 100),
  ];

  return {
    id: "section_1",
    fileName: "sample.xls",
    sectionName: "FOPM01",
    columns: assessmentColumns,
    rows,
    headerRowIndex: 0,
    assessmentColumns,
    courseOutcomeBoundaries: [],
  };
}

function createRows() {
  return [
    createRow("row-1", { co1: 70, co2: 90, co3: "" }),
    createRow("row-2", { co1: 69, co2: 80, co3: "N/A" }),
    createRow("row-3", { co1: 100, co2: 75, co3: 60 }),
  ];
}

function createColumn(
  key: string,
  label: string,
  totalPoints: number,
): SpreadsheetColumn {
  return {
    key,
    label,
    index: 0,
    isPossibleAssessment: true,
    totalPoints,
    totalPointsLabel: `${totalPoints} Score`,
  };
}

function createRow(
  id: string,
  cells: SpreadsheetRow["cells"],
): SpreadsheetRow {
  return {
    id,
    rowIndex: 0,
    cells,
    isValidStudent: true,
  };
}
