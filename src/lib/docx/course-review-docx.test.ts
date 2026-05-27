import { readFileSync } from "node:fs";
import PizZip from "pizzip";
import { describe, expect, it } from "vitest";
import type { CourseReviewResult } from "@/types/course-review";
import {
  createCourseReviewReportFileName,
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

    expect(templateData.sections[0]).toEqual({
      sectionName: "FOPM01",
      outcomes: [
        {
          coCode: "CO1",
          assessmentTask: "Activity 1",
          minSatisfactoryPercent: "70%",
          targetPassedPercent: "70%",
          frequencyPassed: "2",
          percentagePassed: "66.67%",
          remarks: "FAILED",
          recommendation: "",
        },
        {
          coCode: "CO2",
          assessmentTask: "Quiz 2",
          minSatisfactoryPercent: "70%",
          targetPassedPercent: "70%",
          frequencyPassed: "3",
          percentagePassed: "100.00%",
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
    expect(documentXml).toContain("Activity 1");
    expect(documentXml).toContain("66.67%");
    expect(documentXml).toContain("PASSED");
    expect(getDocumentText(documentXml)).toMatch(/COURSE\s+REVIEW\s+\(CS\)/);
    expect(getDocumentText(documentXml)).toContain("Change Syllabus");
    expect(getDocumentText(documentXml)).not.toContain("CSS130 BM2");
    expect(documentXml).not.toContain("{#sections}");
    expect(documentXml).not.toContain("{#outcomes}");
  });

  it("creates a stable report file name from section names", () => {
    expect(createCourseReviewReportFileName(createCourseReviewResult())).toBe(
      "course-review-report-fopm01-fopm02.docx",
    );
  });
});

function createCourseReviewResult(): CourseReviewResult {
  return {
    courseCode: "",
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
