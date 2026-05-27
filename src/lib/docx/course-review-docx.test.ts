import { readFileSync } from "node:fs";
import PizZip from "pizzip";
import { describe, expect, it } from "vitest";
import type { CourseReviewResult } from "@/types/course-review";
import {
  createCourseReviewReportFileName,
  formatDateOfReview,
  prepareCourseReviewDocxTemplateData,
  renderCourseReviewDocxBytes,
} from "./course-review-docx";

const TEMPLATE_PATH = new URL(
  "../../../public/templates/course-review-template.docx",
  import.meta.url,
);

describe("course review DOCX generation", () => {
  it("formats computed results for the DOCX template", () => {
    const templateData = prepareCourseReviewDocxTemplateData(
      createCourseReviewResult(),
    );

    expect(templateData).toEqual(
      expect.objectContaining({
        courseCode: "CSS188-3",
        dateOfReview: "May 27, 2026",
        courseTitle: "",
        academicYear: "",
        quarter: "",
      }),
    );
    expect(templateData.sections[0]).toEqual({
      sectionName: "FOPM01",
      outcomes: [
        {
          coCode: "CO1",
          assessmentTask: "Activity 1",
          minSatisfactoryPercent: "70",
          targetPassedPercent: "70",
          frequencyPassed: "2",
          percentagePassed: "66.67",
          remarks: "FAILED",
          recommendation: "",
        },
        {
          coCode: "CO2",
          assessmentTask: "Quiz 2",
          minSatisfactoryPercent: "70",
          targetPassedPercent: "70",
          frequencyPassed: "3",
          percentagePassed: "100.00",
          remarks: "PASSED",
          recommendation: "",
        },
      ],
    });
  });

  it("creates a DOCX file with repeated section tables", () => {
    const templateBuffer = readFileSync(TEMPLATE_PATH);
    const docxBytes = renderCourseReviewDocxBytes(
      templateBuffer,
      createCourseReviewResult(),
    );

    expect(docxBytes.length).toBeGreaterThan(1000);

    const documentXml = new PizZip(docxBytes)
      .file("word/document.xml")
      ?.asText();

    expect(documentXml).toContain("FOPM01");
    expect(documentXml).toContain("FOPM02");
    expectSectionTitleToUseTemplateStyle(documentXml, "FOPM01");
    expectSectionTitleToUseTemplateStyle(documentXml, "FOPM02");
    expect(documentXml).toContain("Activity 1");
    expect(documentXml).toContain("66.67");
    expect(documentXml).not.toContain("66.67%");
    expect(documentXml).toContain("PASSED");
    expectCellToBeCentered(documentXml, "Activity 1");
    expectCellToBeCentered(documentXml, "66.67");
    expectCellToBeCentered(documentXml, "PASSED");
    expectCellToBeCentered(documentXml, "FAILED");
    expectCellToBeVerticallyCentered(documentXml, "Activity 1");
    expectCellToBeVerticallyCentered(documentXml, "66.67");
    expectCellToBeVerticallyCentered(documentXml, "PASSED");
    expectCellToBeVerticallyCentered(documentXml, "FAILED");
    expectCellToUseStyle(documentXml, "66.67", {
      font: "Arial MT",
      size: "16",
    });
    expectCellToUseStyle(documentXml, "PASSED", {
      color: "001F5F",
      font: "Calibri",
    });
    expectCellToUseStyle(documentXml, "FAILED", {
      color: "FF0000",
      font: "Calibri",
    });
    expect(getDocumentText(documentXml)).toMatch(/COURSE\s+REVIEW\s+\(CS\)/);
    expect(getDocumentText(documentXml)).toContain("CSS188-3");
    expect(getDocumentText(documentXml)).toContain("May 27, 2026");
    expect(getDocumentText(documentXml)).toContain("Change Syllabus");
    expect(getDocumentText(documentXml)).not.toContain("May 7");
    expect(getDocumentText(documentXml)).not.toContain(
      "Data Structures and Algorithms",
    );
    expect(getDocumentText(documentXml)).not.toContain("2022-23");
    expect(getDocumentText(documentXml)).not.toContain("3 Q");
    expect(getDocumentText(documentXml)).not.toContain("CSS130 BM2");
    expect(documentXml).not.toContain("{#sections}");
    expect(documentXml).not.toContain("{#outcomes}");
  });

  it("creates a stable report file name from section names", () => {
    expect(createCourseReviewReportFileName(createCourseReviewResult())).toBe(
      "course-review-report-css188-3-fopm01-fopm02.docx",
    );
  });

  it("formats the generated date of review", () => {
    expect(formatDateOfReview(new Date(2026, 4, 27))).toBe("May 27, 2026");
  });
});

function createCourseReviewResult(): CourseReviewResult {
  return {
    courseCode: "CSS188-3",
    dateOfReview: "May 27, 2026",
    sections: [
      {
        id: "section-1",
        sectionName: "FOPM01",
        fileName: "fopm01.xls",
        totalStudents: 3,
        outcomes: [
          {
            coCode: "CO1",
            assessmentTask: "Activity 1",
            minSatisfactoryPercent: 70,
            targetPassedPercent: 70,
            frequencyPassed: 2,
            percentagePassed: 66.67,
            remarks: "FAILED",
            recommendation: "",
          },
          {
            coCode: "CO2",
            assessmentTask: "Quiz 2",
            minSatisfactoryPercent: 70,
            targetPassedPercent: 70,
            frequencyPassed: 3,
            percentagePassed: 100,
            remarks: "PASSED",
            recommendation: "",
          },
        ],
      },
      {
        id: "section-2",
        sectionName: "FOPM02",
        fileName: "fopm02.xls",
        totalStudents: 2,
        outcomes: [
          {
            coCode: "CO1",
            assessmentTask: "Assignment 1",
            minSatisfactoryPercent: 70,
            targetPassedPercent: 70,
            frequencyPassed: 1,
            percentagePassed: 50,
            remarks: "FAILED",
            recommendation: "",
          },
        ],
      },
    ],
  };
}

function getDocumentText(documentXml = "") {
  return documentXml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
}

function expectCellToBeCentered(documentXml = "", text: string) {
  expect(getCellXmlContaining(documentXml, text)).toContain(
    '<w:jc w:val="center"',
  );
}

function expectCellToBeVerticallyCentered(documentXml = "", text: string) {
  expect(getCellXmlContaining(documentXml, text)).toContain(
    '<w:vAlign w:val="center"',
  );
}

function expectCellToUseStyle(
  documentXml: string | undefined,
  text: string,
  {
    color,
    font,
    size,
  }: {
    color?: string;
    font?: string;
    size?: string;
  },
) {
  const cellXml = getCellXmlContaining(documentXml, text);

  if (color) {
    expect(cellXml).toContain(`<w:color w:val="${color}"`);
  }

  if (font) {
    expect(cellXml).toContain(`w:ascii="${font}"`);
  }

  if (size) {
    expect(cellXml).toContain(`<w:sz w:val="${size}"`);
  }
}

function getCellXmlContaining(documentXml = "", text: string) {
  const cellXml = [...documentXml.matchAll(/<w:tc\b[\s\S]*?<\/w:tc>/g)]
    .map((match) => match[0])
    .find((cell) => cell.includes(`>${text}<`));

  if (!cellXml) {
    throw new Error(`Cell containing "${text}" was not found.`);
  }

  return cellXml;
}

function expectSectionTitleToUseTemplateStyle(documentXml = "", text: string) {
  const paragraphXml = [...documentXml.matchAll(/<w:p\b[\s\S]*?<\/w:p>/g)]
    .map((match) => match[0])
    .find((paragraph) => paragraph.includes(`>${text}<`));

  if (!paragraphXml) {
    throw new Error(`Section title paragraph containing "${text}" was not found.`);
  }

  expect(paragraphXml).toContain('<w:pStyle w:val="BodyText"');
  expect(paragraphXml).toContain('<w:spacing w:before="100"');
  expect(paragraphXml).toContain('<w:ind w:left="100"');
  expect(paragraphXml).not.toContain('<w:spacing w:val="-1"');
}
