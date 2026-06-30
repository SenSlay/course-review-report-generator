import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseSpreadsheetBuffer } from "./parser";
import {
  inferCourseCodeFromFileName,
  inferReportMetadataFromFileName,
  inferSectionNameFromFileName,
} from "./section-name";

const SAMPLE_GRADE_EXPORT = new URL(
  "../../../samples/grades/gc_CSS188-3_FOPM01_2T3031_fullgc_2030-05-18-09-57-51.xls",
  import.meta.url,
);

function parseSampleGradeExport() {
  return parseSpreadsheetBuffer({
    id: "section-1",
    fileName: "gc_CSS188-3_FOPM01_2T3031_fullgc_2030-05-18-09-57-51.xls",
    sectionName: "FOPM01",
    data: readFileSync(SAMPLE_GRADE_EXPORT),
  });
}

describe("spreadsheet parser", () => {
  it("parses the sample Grade Center export", () => {
    const parsedSection = parseSampleGradeExport();

    expect(parsedSection.columns).toHaveLength(19);
    expect(parsedSection.rows).toHaveLength(19);
    expect(parsedSection.rows.filter((row) => row.isValidStudent)).toHaveLength(
      19,
    );
    expect(parsedSection.assessmentColumns).toHaveLength(9);
  });

  it("detects CO grade boundary columns", () => {
    const parsedSection = parseSampleGradeExport();

    expect(
      parsedSection.courseOutcomeBoundaries.map((column) => ({
        code: column.courseOutcomeCode,
        index: column.index,
        label: column.label,
      })),
    ).toEqual([
      { code: "CO1", index: 11, label: "CO1 Grade" },
      { code: "CO2", index: 14, label: "CO2 Grade" },
      { code: "CO3", index: 17, label: "CO3 Grade" },
    ]);
  });

  it("groups assessment columns by CO boundaries without selecting mappings", () => {
    const parsedSection = parseSampleGradeExport();

    const groups = {
      CO1: parsedSection.assessmentColumns.filter(
        (column) => column.assessmentGroup === "CO1",
      ),
      CO2: parsedSection.assessmentColumns.filter(
        (column) => column.assessmentGroup === "CO2",
      ),
      CO3: parsedSection.assessmentColumns.filter(
        (column) => column.assessmentGroup === "CO3",
      ),
    };

    expect(groups.CO1.map((column) => column.label)).toEqual([
      "General Course Requirements and Policies (Ver 3.2)*",
      "FA1 - Activation Functions",
      "SQ - Machine Learning",
      "HMM - Test Code",
      "SQ2 - Hidden Markov Model",
    ]);
    expect(groups.CO2.map((column) => column.label)).toEqual([
      "Creating local AI assistant by utilizing simple LLM (Submission Link)",
      "Using RAG on LLM",
    ]);
    expect(groups.CO3.map((column) => column.label)).toEqual([
      "Sample Application of LangChain",
      "CO2 - Building Auto-GPT Apps with LangChain",
    ]);
  });

  it("infers the section name from a Grade Center filename", () => {
    expect(
      inferSectionNameFromFileName(
        "gc_CSS188-3_FOPM01_2T3031_fullgc_2030-05-18-09-57-51.xls",
      ),
    ).toBe("FOPM01");
  });

  it("infers short section names after the course code", () => {
    expect(
      inferSectionNameFromFileName(
        "CSS182-03 BM2 2T2526 fullgc 2026-06-18-12-18-58.xls",
      ),
    ).toBe("BM2");
    expect(
      inferSectionNameFromFileName(
        "gc CSS182-03 CM2 2T2526 fullgc 2026-06-18-12-19-20.xls",
      ),
    ).toBe("CM2");
  });

  it("keeps the full section name between the course code and report metadata", () => {
    expect(
      inferSectionNameFromFileName(
        "gc_CSS182-03_BSCS 2A Lab_2T2526_fullgc_2026-06-18-12-19-20.xls",
      ),
    ).toBe("BSCS 2A Lab");
  });

  it("infers the course code from a Grade Center filename", () => {
    expect(
      inferCourseCodeFromFileName(
        "gc_CSS188-3_FOPM01_2T3031_fullgc_2030-05-18-09-57-51.xls",
      ),
    ).toBe("CSS188-3");
  });

  it("infers report metadata from a Grade Center filename", () => {
    expect(
      inferReportMetadataFromFileName("gc_CSS188-3_FOPM01_2T3031_fullg.xls"),
    ).toEqual({
      academicYear: "2030-2031",
      quarter: "2T",
    });
  });

  it("infers report metadata from a timestamped Grade Center filename", () => {
    expect(
      inferReportMetadataFromFileName(
        "gc_CSS188-3_FOPM01_2T3031_fullgc_2030-05-18-09-57-51.xls",
      ),
    ).toEqual({
      academicYear: "2030-2031",
      quarter: "2T",
    });
  });

  it("returns blank report metadata when the filename has no metadata token", () => {
    expect(inferReportMetadataFromFileName("plain-export.xls")).toEqual({
      academicYear: "",
      quarter: "",
    });
  });

  it("returns a blank course code when the filename has no course code", () => {
    expect(inferCourseCodeFromFileName("plain-export.xls")).toBe("");
  });
});
