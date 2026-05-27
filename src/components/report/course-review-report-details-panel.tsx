"use client";

import type { CourseReviewReportDetails } from "@/types/course-review";

type CourseReviewReportDetailsPanelProps = {
  details: CourseReviewReportDetails;
  onDetailsChange: (
    field: keyof CourseReviewReportDetails,
    value: string,
  ) => void;
};

const fields: {
  key: keyof CourseReviewReportDetails;
  label: string;
  placeholder: string;
}[] = [
  {
    key: "courseCode",
    label: "Course Code",
    placeholder: "CSS188-3",
  },
  {
    key: "courseTitle",
    label: "Course Title",
    placeholder: "Optional",
  },
  {
    key: "academicYear",
    label: "Academic Year",
    placeholder: "2026-27",
  },
  {
    key: "quarter",
    label: "Quarter",
    placeholder: "3Q",
  },
];

export function CourseReviewReportDetailsPanel({
  details,
  onDetailsChange,
}: CourseReviewReportDetailsPanelProps) {
  return (
    <section className="w-full border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-200 px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-950">
              Report Details
            </h2>
            <p className="text-sm text-zinc-600">
              Course code can be edited. Date of review is added on download.
            </p>
          </div>
          <div className="text-sm font-medium text-zinc-700">
            Header fields
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-5">
        {fields.map((field) => (
          <div key={field.key} className="space-y-2">
            <label
              htmlFor={`report-${field.key}`}
              className="block text-sm font-semibold text-zinc-950"
            >
              {field.label}
            </label>
            <input
              id={`report-${field.key}`}
              type="text"
              value={details[field.key]}
              placeholder={field.placeholder}
              className="h-10 w-full border border-zinc-300 px-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-teal-600"
              onChange={(event) =>
                onDetailsChange(field.key, event.target.value)
              }
            />
          </div>
        ))}
        <div className="space-y-2">
          <label
            htmlFor="report-dateOfReview"
            className="block text-sm font-semibold text-zinc-950"
          >
            Date of Review
          </label>
          <input
            id="report-dateOfReview"
            type="text"
            value="Added on download"
            readOnly
            className="h-10 w-full border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-600 outline-none"
          />
        </div>
      </div>
    </section>
  );
}
