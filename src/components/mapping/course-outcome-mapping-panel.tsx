import type {
  CourseOutcomeCode,
  ParsedSection,
  SectionCourseOutcomeMappingState,
} from "@/types/course-review";
import {
  COURSE_OUTCOME_CODES,
  getMissingMappingCodes,
  getPrioritizedAssessmentColumns,
} from "@/lib/course-review/mapping";

type CourseOutcomeMappingPanelProps = {
  parsedSections: ParsedSection[];
  mappingsBySectionId: Record<string, SectionCourseOutcomeMappingState>;
  onMappingChange: (
    sectionId: string,
    coCode: CourseOutcomeCode,
    columnKey: string,
  ) => void;
};

export function CourseOutcomeMappingPanel({
  parsedSections,
  mappingsBySectionId,
  onMappingChange,
}: CourseOutcomeMappingPanelProps) {
  if (parsedSections.length === 0) {
    return null;
  }

  return (
    <section className="w-full border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-200 px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-950">
              Map Course Outcomes
            </h2>
            <p className="text-sm text-zinc-600">
              Select one assessment column for each Course Outcome per section.
            </p>
          </div>
          <div className="text-sm font-medium text-zinc-700">
            Manual selection required
          </div>
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-6">
        {parsedSections.map((parsedSection) => {
          const mapping = mappingsBySectionId[parsedSection.id];
          const missingMappings = mapping ? getMissingMappingCodes(mapping) : [];
          const hasAssessmentColumns = parsedSection.assessmentColumns.length > 0;

          return (
            <div
              key={parsedSection.id}
              className="border border-zinc-200 bg-zinc-50"
            >
              <div className="border-b border-zinc-200 bg-white px-4 py-3">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-zinc-950">
                      {parsedSection.sectionName}
                    </h3>
                    <p className="text-xs text-zinc-500">
                      {parsedSection.fileName}
                    </p>
                  </div>
                  <p className="text-xs font-medium text-zinc-600">
                    {parsedSection.assessmentColumns.length} assessment options
                  </p>
                </div>
              </div>

              <div className="space-y-4 p-4">
                {!hasAssessmentColumns ? (
                  <div className="border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    No assessment columns were detected for this section.
                  </div>
                ) : null}

                <div className="grid gap-4 lg:grid-cols-3">
                  {COURSE_OUTCOME_CODES.map((coCode) => (
                    <CourseOutcomeSelect
                      key={coCode}
                      coCode={coCode}
                      parsedSection={parsedSection}
                      value={mapping?.[coCode] ?? ""}
                      onChange={(columnKey) =>
                        onMappingChange(parsedSection.id, coCode, columnKey)
                      }
                    />
                  ))}
                </div>

                {missingMappings.length > 0 ? (
                  <p className="text-xs font-medium text-red-700">
                    Mapping required for {missingMappings.join(", ")}.
                  </p>
                ) : (
                  <p className="text-xs font-medium text-teal-700">
                    All Course Outcomes have selected assessment columns.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CourseOutcomeSelect({
  coCode,
  parsedSection,
  value,
  onChange,
}: {
  coCode: CourseOutcomeCode;
  parsedSection: ParsedSection;
  value: string;
  onChange: (columnKey: string) => void;
}) {
  const { groupedColumns, otherColumns } = getPrioritizedAssessmentColumns(
    parsedSection.assessmentColumns,
    coCode,
  );
  const inputId = `${parsedSection.id}-${coCode}`;
  const hasMissingMapping = value.length === 0;

  return (
    <div className="space-y-2">
      <label
        htmlFor={inputId}
        className="block text-sm font-semibold text-zinc-950"
      >
        {coCode}
      </label>
      <select
        id={inputId}
        value={value}
        className={`h-10 w-full border bg-white px-3 text-sm text-zinc-950 outline-none transition focus:border-teal-600 ${
          hasMissingMapping ? "border-red-400" : "border-zinc-300"
        }`}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Select assessment column</option>
        {groupedColumns.length > 0 ? (
          <optgroup label={`${coCode} grouped options`}>
            {groupedColumns.map((column) => (
              <option key={column.key} value={column.key}>
                {column.label}
              </option>
            ))}
          </optgroup>
        ) : null}
        {otherColumns.length > 0 ? (
          <optgroup label="Other assessment columns">
            {otherColumns.map((column) => (
              <option key={column.key} value={column.key}>
                {column.label}
              </option>
            ))}
          </optgroup>
        ) : null}
      </select>
      {hasMissingMapping ? (
        <p className="text-xs font-medium text-red-700">Mapping required.</p>
      ) : null}
    </div>
  );
}
