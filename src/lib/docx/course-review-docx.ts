import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import type { CourseReviewResult } from "@/types/course-review";

export const COURSE_REVIEW_TEMPLATE_URL =
  "/templates/course-review-template.docx";

export const DOCX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

type GenerateCourseReviewDocxOptions = {
  templateUrl?: string;
  templateBuffer?: ArrayBuffer | Uint8Array;
};

export type CourseReviewDocxTemplateData = {
  courseCode: string;
  dateOfReview: string;
  courseTitle: string;
  academicYear: string;
  quarter: string;
  sections: {
    sectionName: string;
    outcomes: {
      coCode: string;
      assessmentTask: string;
      minSatisfactoryPercent: string;
      targetPassedPercent: string;
      frequencyPassed: string;
      percentagePassed: string;
      remarks: string;
      recommendation: "";
    }[];
  }[];
};

export async function generateCourseReviewDocx(
  result: CourseReviewResult,
  options: GenerateCourseReviewDocxOptions = {},
) {
  const templateBuffer =
    options.templateBuffer ??
    (await fetchCourseReviewTemplate(
      options.templateUrl ?? COURSE_REVIEW_TEMPLATE_URL,
    ));
  const docxBytes = renderCourseReviewDocxBytes(templateBuffer, result);

  return new Blob([copyBytesToArrayBuffer(docxBytes)], {
    type: DOCX_MIME_TYPE,
  });
}

export function renderCourseReviewDocxBytes(
  templateBuffer: ArrayBuffer | Uint8Array,
  result: CourseReviewResult,
) {
  try {
    const zip = new PizZip(templateBuffer);
    const document = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    document.render(prepareCourseReviewDocxTemplateData(result));

    const renderedZip = document.getZip();
    const documentXml = renderedZip.file("word/document.xml")?.asText();

    if (documentXml) {
      renderedZip.file("word/document.xml", colorRemarkRuns(documentXml));
    }

    return renderedZip.generate({
      type: "uint8array",
      compression: "DEFLATE",
      mimeType: DOCX_MIME_TYPE,
    });
  } catch (error) {
    throw new Error(getDocxGenerationErrorMessage(error));
  }
}

export function prepareCourseReviewDocxTemplateData(
  result: CourseReviewResult,
): CourseReviewDocxTemplateData {
  return {
    courseCode: result.courseCode ?? "",
    dateOfReview: result.dateOfReview ?? "",
    courseTitle: result.courseTitle ?? "",
    academicYear: result.academicYear ?? "",
    quarter: result.quarter ?? "",
    sections: result.sections.map((section) => ({
      sectionName: section.sectionName,
      outcomes: section.outcomes.map((outcome) => ({
        coCode: outcome.coCode,
        assessmentTask: outcome.assessmentTask,
        minSatisfactoryPercent: formatWholeNumber(
          outcome.minSatisfactoryPercent,
        ),
        targetPassedPercent: formatWholeNumber(outcome.targetPassedPercent),
        frequencyPassed: String(outcome.frequencyPassed),
        percentagePassed: formatNumber(outcome.percentagePassed, 2),
        remarks: outcome.remarks,
        recommendation: "",
      })),
    })),
  };
}

export function createCourseReviewReportFileName(result: CourseReviewResult) {
  const courseCodePart = slugifyFileNamePart(result.courseCode);
  const sectionPart = result.sections
    .map((section) => slugifyFileNamePart(section.sectionName))
    .filter(Boolean)
    .slice(0, 3)
    .join("-");
  const reportParts = [courseCodePart, sectionPart].filter(Boolean).join("-");

  return reportParts.length > 0
    ? `course-review-report-${reportParts}.docx`
    : "course-review-report.docx";
}

export function formatDateOfReview(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

async function fetchCourseReviewTemplate(templateUrl: string) {
  const response = await fetch(templateUrl);

  if (!response.ok) {
    throw new Error("The DOCX template could not be loaded.");
  }

  return response.arrayBuffer();
}

function formatWholeNumber(value: number) {
  return formatNumber(value, 0);
}

function formatNumber(value: number, fractionDigits: number) {
  return value.toFixed(fractionDigits);
}

function slugifyFileNamePart(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function copyBytesToArrayBuffer(bytes: Uint8Array) {
  const arrayBuffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(arrayBuffer).set(bytes);

  return arrayBuffer;
}

function colorRemarkRuns(documentXml: string) {
  return documentXml.replace(
    /<w:r\b[^>]*>(?:(?!<\/w:r>)[\s\S])*?<w:t\b[^>]*>(PASSED|FAILED)<\/w:t>(?:(?!<\/w:r>)[\s\S])*?<\/w:r>/g,
    (runXml: string, remark: string) =>
      setRunColor(runXml, remark === "PASSED" ? "001F5F" : "FF0000"),
  );
}

function setRunColor(runXml: string, color: string) {
  const colorTag = `<w:color w:val="${color}"/>`;

  if (/<w:rPr>[\s\S]*?<\/w:rPr>/.test(runXml)) {
    return runXml.replace(/<w:rPr>([\s\S]*?)<\/w:rPr>/, (_match, rPr) => {
      const nextRunProperties = /<w:color\b[^>]*\/>/.test(rPr)
        ? rPr.replace(/<w:color\b[^>]*\/>/, colorTag)
        : `${rPr}${colorTag}`;

      return `<w:rPr>${nextRunProperties}</w:rPr>`;
    });
  }

  return runXml.replace(/(<w:r\b[^>]*>)/, `$1<w:rPr>${colorTag}</w:rPr>`);
}

function getDocxGenerationErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.length > 0) {
    return `The DOCX report could not be generated. ${error.message}`;
  }

  return "The DOCX report could not be generated.";
}
