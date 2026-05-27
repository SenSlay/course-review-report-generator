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

    return document.getZip().generate({
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
    sections: result.sections.map((section) => ({
      sectionName: section.sectionName,
      outcomes: section.outcomes.map((outcome) => ({
        coCode: outcome.coCode,
        assessmentTask: outcome.assessmentTask,
        minSatisfactoryPercent: formatWholePercent(
          outcome.minSatisfactoryPercent,
        ),
        targetPassedPercent: formatWholePercent(outcome.targetPassedPercent),
        frequencyPassed: String(outcome.frequencyPassed),
        percentagePassed: formatPercent(outcome.percentagePassed, 2),
        remarks: outcome.remarks,
        recommendation: "",
      })),
    })),
  };
}

export function createCourseReviewReportFileName(result: CourseReviewResult) {
  const sectionPart = result.sections
    .map((section) => slugifyFileNamePart(section.sectionName))
    .filter(Boolean)
    .slice(0, 3)
    .join("-");

  return sectionPart.length > 0
    ? `course-review-report-${sectionPart}.docx`
    : "course-review-report.docx";
}

async function fetchCourseReviewTemplate(templateUrl: string) {
  const response = await fetch(templateUrl);

  if (!response.ok) {
    throw new Error("The DOCX template could not be loaded.");
  }

  return response.arrayBuffer();
}

function formatWholePercent(value: number) {
  return formatPercent(value, 0);
}

function formatPercent(value: number, fractionDigits: number) {
  return `${value.toFixed(fractionDigits)}%`;
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

function getDocxGenerationErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.length > 0) {
    return `The DOCX report could not be generated. ${error.message}`;
  }

  return "The DOCX report could not be generated.";
}
