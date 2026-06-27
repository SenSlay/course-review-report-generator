import { describe, expect, it } from "vitest";
import type { SpreadsheetColumn } from "@/types/course-review";
import {
  createEmptySectionMapping,
  getMissingMappingCodes,
  getPrioritizedAssessmentColumns,
  updateSectionMapping,
} from "./mapping";

const columns = [
  createColumn("co1_a", "CO1 Activity", "CO1"),
  createColumn("co2_a", "CO2 Activity", "CO2"),
  createColumn("co3_a", "CO3 Activity", "CO3"),
  createColumn("other", "Ungrouped Activity"),
];

describe("course outcome mapping helpers", () => {
  it("initializes empty mappings for all MVP course outcomes", () => {
    expect(createEmptySectionMapping()).toEqual({
      CO1: "",
      CO2: "",
      CO3: "",
    });
  });

  it("prioritizes assessment columns that match the selected CO group", () => {
    const options = getPrioritizedAssessmentColumns(columns, "CO2");

    expect(options.groupedColumns.map((column) => column.key)).toEqual([
      "co2_a",
    ]);
    expect(options.otherColumns.map((column) => column.key)).toEqual([
      "co1_a",
      "co3_a",
      "other",
    ]);
  });

  it("updates only the selected CO mapping", () => {
    const mapping = updateSectionMapping(
      createEmptySectionMapping(),
      "CO2",
      "co2_a",
    );

    expect(mapping).toEqual({
      CO1: "",
      CO2: "co2_a",
      CO3: "",
    });
  });

  it("detects missing required mappings", () => {
    expect(
      getMissingMappingCodes({
        CO1: "co1_a",
        CO2: "",
        CO3: "",
      }),
    ).toEqual(["CO2"]);
  });

  it("does not require CO3 mapping", () => {
    expect(
      getMissingMappingCodes({
        CO1: "co1_a",
        CO2: "co2_a",
        CO3: "",
      }),
    ).toEqual([]);
  });
});

function createColumn(
  key: string,
  label: string,
  assessmentGroup?: SpreadsheetColumn["assessmentGroup"],
): SpreadsheetColumn {
  return {
    key,
    label,
    index: 0,
    isPossibleAssessment: true,
    assessmentGroup,
  };
}
