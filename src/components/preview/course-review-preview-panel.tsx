import type {
  CourseReviewResult,
  CourseReviewValidationError,
} from "@/types/course-review";

type CourseReviewPreviewPanelProps = {
  errors: CourseReviewValidationError[];
  result: CourseReviewResult | null;
  onCompute: () => void;
};

export function CourseReviewPreviewPanel({
  errors,
  result,
  onCompute,
}: CourseReviewPreviewPanelProps) {
  return (
    <section className="w-full rounded-md border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-200 px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-[#A6192E] bg-[#A6192E] text-xs font-semibold text-white">
              4
            </span>
            <div>
              <h2 className="text-lg font-semibold text-zinc-950">
                Course Review Preview
              </h2>
              <p className="text-sm text-zinc-600">
                Generate the validation preview before creating the DOCX report.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="h-10 cursor-pointer rounded-sm border border-zinc-900 bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800"
            onClick={onCompute}
          >
            {result ? "Regenerate Preview" : "Generate Preview"}
          </button>
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-6">
        {errors.length > 0 ? (
          <div className="space-y-2 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
            <p className="font-semibold">Preview could not be generated.</p>
            {errors.map((error) => (
              <p
                key={`${error.sectionId ?? "course"}-${error.coCode ?? "all"}-${error.message}`}
              >
                {error.message}
              </p>
            ))}
          </div>
        ) : null}

        {result ? (
          <div className="space-y-5">
            {result.sections.map((section) => (
              <div key={section.id} className="rounded-md border border-zinc-200">
                <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-semibold text-zinc-950">
                        {section.sectionName}
                      </h3>
                      <p className="text-xs text-zinc-600">
                        {section.fileName}
                      </p>
                    </div>
                    <span className="inline-flex w-fit items-center rounded-sm border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700">
                      {section.totalStudents} valid students
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-zinc-200 text-left text-sm">
                    <thead className="bg-white text-xs font-semibold uppercase text-zinc-600">
                      <tr>
                        <th className="px-4 py-3">Course Outcome</th>
                        <th className="min-w-64 px-4 py-3">
                          Assessment Task
                        </th>
                        <th className="px-4 py-3 text-right">
                          Min. Satisfactory %
                        </th>
                        <th className="px-4 py-3 text-right">
                          Target Passed %
                        </th>
                        <th className="px-4 py-3 text-right">Frequency</th>
                        <th className="px-4 py-3 text-right">Percentage</th>
                        <th className="px-4 py-3">Remarks</th>
                        <th className="px-4 py-3">Recommendation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      {section.outcomes.map((outcome) => (
                        <tr key={outcome.coCode}>
                          <td className="whitespace-nowrap px-4 py-3 font-medium text-zinc-950">
                            {outcome.coCode}
                          </td>
                          <td className="px-4 py-3 text-zinc-700">
                            {outcome.assessmentTask}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right text-zinc-700">
                            {formatPercent(outcome.minSatisfactoryPercent)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right text-zinc-700">
                            {formatPercent(outcome.targetPassedPercent)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right text-zinc-700">
                            {outcome.frequencyPassed}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right text-zinc-700">
                            {formatPercent(outcome.percentagePassed, 2)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <span
                              className={`inline-flex rounded-sm border px-2 py-1 text-xs font-semibold ${
                                outcome.remarks === "PASSED"
                                  ? "border-blue-200 bg-blue-50 text-blue-800"
                                  : "border-red-200 bg-red-50 text-red-700"
                              }`}
                            >
                              {outcome.remarks}
                            </span>
                          </td>
                          <td
                            aria-label={`${outcome.coCode} recommendation intentionally blank`}
                            className="min-w-36 px-4 py-3 text-zinc-700"
                          >
                            {outcome.recommendation}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-600">
            Preview will appear here after every section has required Course
            Outcome mappings.
          </div>
        )}
      </div>
    </section>
  );
}

function formatPercent(value: number, fractionDigits = 0) {
  return `${value.toFixed(fractionDigits)}%`;
}
