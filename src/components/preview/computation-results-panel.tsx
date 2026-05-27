import type {
  CourseReviewResult,
  CourseReviewValidationError,
} from "@/types/course-review";

type ComputationResultsPanelProps = {
  errors: CourseReviewValidationError[];
  result: CourseReviewResult | null;
  onCompute: () => void;
};

export function ComputationResultsPanel({
  errors,
  result,
  onCompute,
}: ComputationResultsPanelProps) {
  return (
    <section className="w-full border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-200 px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-950">
              Compute Results
            </h2>
            <p className="text-sm text-zinc-600">
              Calculate frequency, percentage, and remarks from the selected
              mappings.
            </p>
          </div>
          <button
            type="button"
            className="h-10 border border-zinc-900 bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800"
            onClick={onCompute}
          >
            Compute Results
          </button>
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-6">
        {errors.length > 0 ? (
          <div className="border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
            {errors.map((error) => (
              <p key={`${error.sectionId ?? "course"}-${error.coCode ?? "all"}-${error.message}`}>
                {error.message}
              </p>
            ))}
          </div>
        ) : null}

        {result ? (
          <div className="space-y-4">
            {result.sections.map((section) => (
              <div key={section.id} className="border border-zinc-200">
                <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-3">
                  <h3 className="font-semibold text-zinc-950">
                    {section.sectionName}
                  </h3>
                  <p className="text-xs text-zinc-600">
                    {section.totalStudents} valid students
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-zinc-200 text-left text-sm">
                    <thead className="bg-white text-xs font-semibold uppercase text-zinc-600">
                      <tr>
                        <th className="px-4 py-3">CO</th>
                        <th className="px-4 py-3">Assessment</th>
                        <th className="px-4 py-3">Frequency</th>
                        <th className="px-4 py-3">Percentage</th>
                        <th className="px-4 py-3">Remarks</th>
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
                          <td className="whitespace-nowrap px-4 py-3 text-zinc-700">
                            {outcome.frequencyPassed}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-zinc-700">
                            {outcome.percentagePassed.toFixed(2)}%
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 font-semibold text-zinc-950">
                            {outcome.remarks}
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
          <div className="border border-zinc-200 bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-600">
            Computed results will appear here after all mappings are selected.
          </div>
        )}
      </div>
    </section>
  );
}
