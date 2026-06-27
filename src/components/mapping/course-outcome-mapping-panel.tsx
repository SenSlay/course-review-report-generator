import type { ReactNode } from "react";
import type {
  CourseOutcomeCode,
  ParsedSection,
  SectionCourseOutcomeMappingState,
} from "@/types/course-review";
import {
  COURSE_OUTCOME_CODES,
  REQUIRED_COURSE_OUTCOME_CODES,
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
    <section className="w-full rounded-md border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-200 px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-[#A6192E] bg-[#A6192E] text-xs font-semibold text-white">
              2
            </span>
            <div>
              <h2 className="text-lg font-semibold text-zinc-950">
                Map Course Outcomes
              </h2>
              <p className="text-sm text-zinc-600">
                Select assessment columns for required outcomes per section.
              </p>
            </div>
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
              className="rounded-md border border-zinc-200 bg-zinc-50 shadow-sm"
            >
              <div className="border-b border-zinc-200 bg-white px-4 py-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-zinc-950">
                      {parsedSection.sectionName}
                    </h3>
                    <p className="text-xs text-zinc-500">
                      {parsedSection.fileName}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge tone="neutral">
                      {parsedSection.assessmentColumns.length} assessment
                      options
                    </StatusBadge>
                    <StatusBadge
                      tone={missingMappings.length > 0 ? "danger" : "success"}
                    >
                      {missingMappings.length > 0
                        ? `${missingMappings.length} mappings missing`
                        : "Required mappings selected"}
                    </StatusBadge>
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-4">
                {!hasAssessmentColumns ? (
                  <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    No assessment columns were detected for this section.
                  </div>
                ) : null}

                <div className="grid gap-4 lg:grid-cols-3">
                  {COURSE_OUTCOME_CODES.map((coCode) => (
                    <CourseOutcomeSelect
                      key={coCode}
                      coCode={coCode}
                      isRequired={REQUIRED_COURSE_OUTCOME_CODES.includes(
                        coCode,
                      )}
                      parsedSection={parsedSection}
                      value={mapping?.[coCode] ?? ""}
                      onChange={(columnKey) =>
                        onMappingChange(parsedSection.id, coCode, columnKey)
                      }
                    />
                  ))}
                </div>

                {missingMappings.length > 0 ? (
                  <p className="rounded-sm border-l-4 border-red-500 bg-red-50 px-3 py-2 text-xs font-medium text-red-800">
                    Mapping required for {missingMappings.join(", ")}.
                  </p>
                ) : (
                  <p className="rounded-sm border-l-4 border-[#D4AF37] bg-[#FFF8E1] px-3 py-2 text-xs font-medium text-[#7A5B00]">
                    Required Course Outcomes have selected assessment columns.
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
  isRequired,
  parsedSection,
  value,
  onChange,
}: {
  coCode: CourseOutcomeCode;
  isRequired: boolean;
  parsedSection: ParsedSection;
  value: string;
  onChange: (columnKey: string) => void;
}) {
  const { groupedColumns, otherColumns } = getPrioritizedAssessmentColumns(
    parsedSection.assessmentColumns,
    coCode,
  );
  const inputId = `${parsedSection.id}-${coCode}`;
  const hasSelectedMapping = value.length > 0;
  const hasMissingMapping = isRequired && !hasSelectedMapping;

  return (
    <div className="rounded-md border border-zinc-200 bg-white p-3">
      <label
        htmlFor={inputId}
        className="mb-2 flex items-center justify-between gap-2 text-sm font-semibold text-zinc-950"
      >
        <span>{coCode}</span>
        {hasSelectedMapping ? (
          <span className="text-xs font-semibold text-[#7A5B00]">
            Selected
          </span>
        ) : isRequired ? (
          <span className="text-xs font-semibold text-red-700">Required</span>
        ) : (
          <span className="text-xs font-semibold text-zinc-500">Optional</span>
        )}
      </label>
      <select
        id={inputId}
        value={value}
        className={`h-10 w-full rounded-sm border bg-white px-3 text-sm text-zinc-950 outline-none transition focus:border-[#A6192E] ${
          hasMissingMapping ? "border-red-400" : "border-zinc-300"
        }`}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">
          {isRequired
            ? "Select assessment column"
            : "Select assessment column (optional)"}
        </option>
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
        <p className="mt-2 text-xs font-medium text-red-700">
          Select the assessment column used for {coCode}.
        </p>
      ) : !isRequired && !hasSelectedMapping ? (
        <p className="mt-2 text-xs font-medium text-zinc-500">
          Leave blank when this course does not use {coCode}.
        </p>
      ) : null}
    </div>
  );
}

function StatusBadge({
  tone,
  children,
}: {
  tone: "neutral" | "success" | "danger";
  children: ReactNode;
}) {
  const toneClassName = {
    neutral: "border-zinc-200 bg-zinc-50 text-zinc-600",
    success: "border-[#D4AF37] bg-[#FFF8E1] text-[#7A5B00]",
    danger: "border-red-200 bg-red-50 text-red-700",
  }[tone];

  return (
    <span
      className={`inline-flex w-fit items-center rounded-sm border px-2.5 py-1 text-xs font-semibold ${toneClassName}`}
    >
      {children}
    </span>
  );
}
