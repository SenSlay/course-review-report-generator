"use client";

import { useState } from "react";
import type {
  CourseReviewReportDetails,
  CourseReviewResult,
} from "@/types/course-review";
import {
  createCourseReviewReportFileName,
  generateCourseReviewDocx,
} from "@/lib/docx/course-review-docx";
import { downloadBlob } from "@/lib/docx/download";

type CourseReviewReportDownloadPanelProps = {
  result: CourseReviewResult | null;
  reportDetails: CourseReviewReportDetails;
};

export function CourseReviewReportDownloadPanel({
  result,
  reportDetails,
}: CourseReviewReportDownloadPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!result) {
    return null;
  }

  async function handleDownload() {
    if (!result) {
      return;
    }

    setIsGenerating(true);
    setErrorMessage("");

    try {
      const resultWithReportDetails = {
        ...result,
        ...reportDetails,
      };
      const reportBlob = await generateCourseReviewDocx(
        resultWithReportDetails,
      );
      downloadBlob(
        reportBlob,
        createCourseReviewReportFileName(resultWithReportDetails),
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The DOCX report could not be generated.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <section className="w-full border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-200 px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-950">
              Generate DOCX Report
            </h2>
            <p className="text-sm text-zinc-600">
              Download the report using the validated preview results.
            </p>
          </div>
          <button
            type="button"
            className="h-10 border border-zinc-900 bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:border-zinc-300 disabled:bg-zinc-200 disabled:text-zinc-500"
            disabled={isGenerating}
            onClick={handleDownload}
          >
            {isGenerating ? "Generating..." : "Download DOCX"}
          </button>
        </div>
      </div>

      {errorMessage.length > 0 ? (
        <div className="p-4 sm:p-6">
          <div className="border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
            {errorMessage}
          </div>
        </div>
      ) : null}
    </section>
  );
}
