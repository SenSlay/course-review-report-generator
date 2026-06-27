"use client";

import { ChangeEvent, DragEvent, ReactNode, useRef, useState } from "react";
import type {
  CourseOutcomeCode,
  CourseReviewReportDetails,
  CourseReviewResult,
  CourseReviewValidationError,
  ParsedSection,
  SectionCourseOutcomeMappingState,
  SpreadsheetParseStatus,
  UploadedSpreadsheetFile,
} from "@/types/course-review";
import { CourseOutcomeMappingPanel } from "@/components/mapping/course-outcome-mapping-panel";
import { CourseReviewPreviewPanel } from "@/components/preview/course-review-preview-panel";
import { CourseReviewReportDetailsPanel } from "@/components/report/course-review-report-details-panel";
import { CourseReviewReportDownloadPanel } from "@/components/report/course-review-report-download-panel";
import {
  computeCourseReviewResult,
  validateCourseReviewComputation,
} from "@/lib/course-review/computation";
import { formatDateOfReview } from "@/lib/docx/course-review-docx";
import {
  createEmptySectionMapping,
  REQUIRED_COURSE_OUTCOME_CODES,
  updateSectionMapping,
} from "@/lib/course-review/mapping";
import { parseSpreadsheetFile } from "@/lib/spreadsheet/parser";
import {
  inferCourseCodeFromFileName,
  inferReportMetadataFromFileName,
  inferSectionNameFromFileName,
} from "@/lib/spreadsheet/section-name";

const ACCEPTED_EXCEL_EXTENSIONS = [".xls", ".xlsx"];

function createUploadId(file: File, index: number) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${file.name}-${file.lastModified}-${Date.now()}-${index}`;
}

function isExcelFile(file: File) {
  const lowerCaseName = file.name.toLowerCase();

  return ACCEPTED_EXCEL_EXTENSIONS.some((extension) =>
    lowerCaseName.endsWith(extension),
  );
}

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }

  const kilobytes = size / 1024;

  if (kilobytes < 1024) {
    return `${kilobytes.toFixed(1)} KB`;
  }

  return `${(kilobytes / 1024).toFixed(1)} MB`;
}

type UploadError = {
  id: string;
  message: string;
};

type ParsedSectionState = {
  status: SpreadsheetParseStatus;
  sectionName?: string;
  parsedSection?: ParsedSection;
  errorMessage?: string;
};

const EMPTY_REPORT_DETAILS: CourseReviewReportDetails = {
  courseCode: "",
  dateOfReview: "",
  courseTitle: "",
  academicYear: "",
  quarter: "",
};

function createInitialReportDetails(): CourseReviewReportDetails {
  return {
    ...EMPTY_REPORT_DETAILS,
    dateOfReview: formatDateOfReview(new Date()),
  };
}

export function SpreadsheetUploadWorkspace() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedSpreadsheetFile[]>(
    [],
  );
  const [isDragging, setIsDragging] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<UploadError[]>([]);
  const [parsedSections, setParsedSections] = useState<
    Record<string, ParsedSectionState>
  >({});
  const [mappingsBySectionId, setMappingsBySectionId] = useState<
    Record<string, SectionCourseOutcomeMappingState>
  >({});
  const [courseReviewResult, setCourseReviewResult] =
    useState<CourseReviewResult | null>(null);
  const [computationErrors, setComputationErrors] = useState<
    CourseReviewValidationError[]
  >([]);
  const [reportDetails, setReportDetails] = useState<CourseReviewReportDetails>(
    createInitialReportDetails,
  );
  const [courseCodeWasEdited, setCourseCodeWasEdited] = useState(false);
  const [academicYearWasEdited, setAcademicYearWasEdited] = useState(false);
  const [quarterWasEdited, setQuarterWasEdited] = useState(false);

  function addFiles(files: FileList | File[]) {
    const fileList = Array.from(files);
    const acceptedFiles = fileList.filter(isExcelFile);
    const rejectedFiles = fileList.filter((file) => !isExcelFile(file));

    const nextUploadedFiles = acceptedFiles.map((file, index) => ({
      id: createUploadId(file, index),
      file,
      fileName: file.name,
      sectionName: inferSectionNameFromFileName(file.name),
    }));

    setUploadedFiles((currentFiles) => [
      ...currentFiles,
      ...nextUploadedFiles,
    ]);
    setParsedSections((currentSections) => ({
      ...currentSections,
      ...Object.fromEntries(
        nextUploadedFiles.map((uploadedFile) => [
          uploadedFile.id,
          {
            status: "parsing" satisfies SpreadsheetParseStatus,
            sectionName: uploadedFile.sectionName,
          },
        ]),
      ),
    }));
    setMappingsBySectionId((currentMappings) => ({
      ...currentMappings,
      ...Object.fromEntries(
        nextUploadedFiles.map((uploadedFile) => [
          uploadedFile.id,
          createEmptySectionMapping(),
        ]),
      ),
    }));
    setUploadErrors(
      rejectedFiles.map((file, index) => ({
        id: `${file.name}-${Date.now()}-${index}`,
        message: `${file.name} was skipped. Upload .xls or .xlsx files only.`,
      })),
    );
    inferReportDetailsFromUploadedFiles(nextUploadedFiles);
    clearComputationState();
    parseUploadedFiles(nextUploadedFiles);
  }

  function inferReportDetailsFromUploadedFiles(files: UploadedSpreadsheetFile[]) {
    const inferredCourseCode = files
      .map((uploadedFile) => inferCourseCodeFromFileName(uploadedFile.fileName))
      .find(Boolean);
    const inferredAcademicYear = files
      .map(
        (uploadedFile) =>
          inferReportMetadataFromFileName(uploadedFile.fileName).academicYear,
      )
      .find(Boolean);
    const inferredQuarter = files
      .map(
        (uploadedFile) =>
          inferReportMetadataFromFileName(uploadedFile.fileName).quarter,
      )
      .find(Boolean);

    setReportDetails((currentDetails) => {
      const nextDetails = { ...currentDetails };
      let hasUpdate = false;

      if (
        !courseCodeWasEdited &&
        currentDetails.courseCode.trim().length === 0 &&
        inferredCourseCode
      ) {
        nextDetails.courseCode = inferredCourseCode;
        hasUpdate = true;
      }

      if (
        !academicYearWasEdited &&
        currentDetails.academicYear.trim().length === 0 &&
        inferredAcademicYear
      ) {
        nextDetails.academicYear = inferredAcademicYear;
        hasUpdate = true;
      }

      if (
        !quarterWasEdited &&
        currentDetails.quarter.trim().length === 0 &&
        inferredQuarter
      ) {
        nextDetails.quarter = inferredQuarter;
        hasUpdate = true;
      }

      return hasUpdate ? nextDetails : currentDetails;
    });
  }

  function parseUploadedFiles(files: UploadedSpreadsheetFile[]) {
    files.forEach(async (uploadedFile) => {
      try {
        const parsedSection = await parseSpreadsheetFile(uploadedFile.file, {
          id: uploadedFile.id,
          sectionName: uploadedFile.sectionName,
        });

        setParsedSections((currentSections) => ({
          ...currentSections,
          ...getParsedSectionUpdate(currentSections, uploadedFile.id, {
            status: "parsed",
            sectionName: parsedSection.sectionName,
            parsedSection,
          }),
        }));
      } catch (error) {
        setParsedSections((currentSections) => ({
          ...currentSections,
          ...getParsedSectionUpdate(currentSections, uploadedFile.id, {
            status: "failed",
            sectionName: uploadedFile.sectionName,
            errorMessage:
              error instanceof Error
                ? error.message
                : "The spreadsheet could not be parsed.",
          }),
        }));
      }
    });
  }

  function getParsedSectionUpdate(
    currentSections: Record<string, ParsedSectionState>,
    uploadedFileId: string,
    nextSection: ParsedSectionState,
  ) {
    const currentSection = currentSections[uploadedFileId];

    if (!currentSection) {
      return {};
    }

    if (!nextSection.parsedSection) {
      return {
        [uploadedFileId]: {
          ...nextSection,
          sectionName: currentSection.sectionName ?? nextSection.sectionName,
        },
      };
    }

    return {
      [uploadedFileId]: {
        ...nextSection,
        sectionName: currentSection.sectionName ?? nextSection.sectionName,
        parsedSection: {
          ...nextSection.parsedSection,
          sectionName:
            currentSection.sectionName ?? nextSection.parsedSection.sectionName,
        },
      },
    };
  }

  function handleFileInputChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) {
      addFiles(event.target.files);
    }

    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    addFiles(event.dataTransfer.files);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    const nextTarget = event.relatedTarget;

    if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
      setIsDragging(false);
    }
  }

  function updateSectionName(id: string, sectionName: string) {
    clearComputationState();
    setUploadedFiles((currentFiles) =>
      currentFiles.map((uploadedFile) =>
        uploadedFile.id === id ? { ...uploadedFile, sectionName } : uploadedFile,
      ),
    );
    setParsedSections((currentSections) => {
      const currentSection = currentSections[id];

      if (!currentSection) {
        return currentSections;
      }

      if (!currentSection.parsedSection) {
        return {
          ...currentSections,
          [id]: {
            ...currentSection,
            sectionName,
          },
        };
      }

      return {
        ...currentSections,
        [id]: {
          ...currentSection,
          sectionName,
          parsedSection: {
            ...currentSection.parsedSection,
            sectionName,
          },
        },
      };
    });
  }

  function removeFile(id: string) {
    clearComputationState();
    setUploadedFiles((currentFiles) =>
      currentFiles.filter((uploadedFile) => uploadedFile.id !== id),
    );
    setParsedSections((currentSections) => {
      const remainingSections = { ...currentSections };
      delete remainingSections[id];

      return remainingSections;
    });
    setMappingsBySectionId((currentMappings) => {
      const remainingMappings = { ...currentMappings };
      delete remainingMappings[id];

      return remainingMappings;
    });
  }

  function updateCourseOutcomeMapping(
    sectionId: string,
    coCode: CourseOutcomeCode,
    columnKey: string,
  ) {
    clearComputationState();
    setMappingsBySectionId((currentMappings) => ({
      ...currentMappings,
      [sectionId]: updateSectionMapping(
        currentMappings[sectionId] ?? createEmptySectionMapping(),
        coCode,
        columnKey,
      ),
    }));
  }

  function updateReportDetails(
    field: keyof CourseReviewReportDetails,
    value: string,
  ) {
    if (field === "courseCode") {
      setCourseCodeWasEdited(true);
    }

    if (field === "academicYear") {
      setAcademicYearWasEdited(true);
    }

    if (field === "quarter") {
      setQuarterWasEdited(true);
    }

    setReportDetails((currentDetails) => ({
      ...currentDetails,
      [field]: value,
    }));
  }

  function computeResults() {
    const validationErrors = validateCourseReviewComputation({
      parsedSections: successfullyParsedSections,
      mappingsBySectionId,
    });

    if (validationErrors.length > 0) {
      setComputationErrors(validationErrors);
      setCourseReviewResult(null);
      return;
    }

    setComputationErrors([]);
    setCourseReviewResult(
      computeCourseReviewResult({
        parsedSections: successfullyParsedSections,
        mappingsBySectionId,
        ...reportDetails,
      }),
    );
  }

  function clearComputationState() {
    setComputationErrors([]);
    setCourseReviewResult(null);
  }

  const successfullyParsedSections = uploadedFiles
    .map((uploadedFile) => parsedSections[uploadedFile.id]?.parsedSection)
    .filter((parsedSection): parsedSection is ParsedSection =>
      Boolean(parsedSection),
    );
  const requiredMappingsSelected =
    successfullyParsedSections.length > 0 &&
    successfullyParsedSections.every((parsedSection) =>
      REQUIRED_COURSE_OUTCOME_CODES.every(
        (coCode) =>
          (mappingsBySectionId[parsedSection.id]?.[coCode] ?? "").length > 0,
      ),
    );

  return (
    <>
      <WorkflowProgress
        uploadedCount={uploadedFiles.length}
        parsedCount={successfullyParsedSections.length}
        requiredMappingsSelected={requiredMappingsSelected}
        hasReportDetails={successfullyParsedSections.length > 0}
        reportDetailsAreFilled={Object.values(reportDetails).every(
          (value) => value.trim().length > 0,
        )}
        hasPreview={Boolean(courseReviewResult)}
      />

      <section className="w-full rounded-md border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-[#A6192E] bg-[#A6192E] text-xs font-semibold text-white">
                1
              </span>
              <div>
                <h2 className="text-lg font-semibold text-zinc-950">
                  Upload Grade Spreadsheets
                </h2>
                <p className="text-sm text-zinc-600">
                  Each Excel file will be treated as one course section.
                </p>
              </div>
            </div>
            <div className="inline-flex w-fit items-center rounded-sm border border-zinc-200 bg-zinc-50 px-3 py-1 text-sm font-medium text-zinc-700">
              {uploadedFiles.length}{" "}
              {uploadedFiles.length === 1 ? "section" : "sections"}
            </div>
          </div>
        </div>

        <div className="space-y-5 p-4 sm:p-6">
          <div
            className={`flex min-h-44 flex-col items-center justify-center rounded-md border-2 border-dashed px-4 py-8 text-center transition-colors ${
              isDragging
                ? "border-[#A6192E] bg-red-50"
                : "border-zinc-300 bg-zinc-50"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xls,.xlsx"
              multiple
              className="sr-only"
              onChange={handleFileInputChange}
            />
            <div className="max-w-xl space-y-3">
              <p className="text-base font-semibold text-zinc-950">
                Drop Excel files here
              </p>
              <p className="text-sm text-zinc-600">
                Upload one Grade Center export per course section.
              </p>
              <button
                type="button"
                className="inline-flex h-10 cursor-pointer items-center justify-center rounded-sm border border-zinc-900 bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose files
              </button>
            </div>
          </div>

          {uploadErrors.length > 0 ? (
            <div className="space-y-1 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {uploadErrors.map((error) => (
                <p key={error.id}>{error.message}</p>
              ))}
            </div>
          ) : null}

          {uploadedFiles.length === 0 ? (
            <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center">
              <h3 className="text-sm font-semibold text-zinc-950">
                No spreadsheets uploaded yet
              </h3>
              <p className="mt-1 text-sm text-zinc-600">
                Uploaded files will appear here as editable section entries.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border border-zinc-200">
              <table className="min-w-full divide-y divide-zinc-200 text-left text-sm">
                <thead className="bg-zinc-50 text-xs font-semibold uppercase text-zinc-600">
                  <tr>
                    <th className="px-4 py-3">File</th>
                    <th className="px-4 py-3">Section Name</th>
                    <th className="min-w-64 px-4 py-3">Status</th>
                    <th className="w-24 px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 bg-white">
                  {uploadedFiles.map((uploadedFile) => {
                    const sectionNameIsMissing =
                      uploadedFile.sectionName.trim().length === 0;
                    const parsedSectionState = parsedSections[uploadedFile.id];

                    return (
                      <tr key={uploadedFile.id} className="align-top">
                        <td className="max-w-xs px-4 py-4">
                          <p className="break-words font-medium text-zinc-950">
                            {uploadedFile.fileName}
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">
                            {formatFileSize(uploadedFile.file.size)}
                          </p>
                        </td>
                        <td className="min-w-72 px-4 py-4">
                          <label className="sr-only" htmlFor={uploadedFile.id}>
                            Section name for {uploadedFile.fileName}
                          </label>
                          <input
                            id={uploadedFile.id}
                            type="text"
                            value={uploadedFile.sectionName}
                            className={`h-10 w-full rounded-sm border px-3 text-sm text-zinc-950 outline-none transition focus:border-[#A6192E] ${
                              sectionNameIsMissing
                                ? "border-red-400"
                                : "border-zinc-300"
                            }`}
                            onChange={(event) =>
                              updateSectionName(
                                uploadedFile.id,
                                event.target.value,
                              )
                            }
                          />
                          {sectionNameIsMissing ? (
                            <p className="mt-1 text-xs font-medium text-red-700">
                              Section name is required before computation.
                            </p>
                          ) : null}
                        </td>
                        <td className="px-4 py-4 text-zinc-600">
                          <ParseSummary parseState={parsedSectionState} />
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button
                            type="button"
                            className="h-9 cursor-pointer rounded-sm border border-zinc-300 px-3 text-sm font-medium text-zinc-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                            onClick={() => removeFile(uploadedFile.id)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <CourseOutcomeMappingPanel
        parsedSections={successfullyParsedSections}
        mappingsBySectionId={mappingsBySectionId}
        onMappingChange={updateCourseOutcomeMapping}
      />

      {successfullyParsedSections.length > 0 ? (
        <CourseReviewReportDetailsPanel
          details={reportDetails}
          onDetailsChange={updateReportDetails}
        />
      ) : null}

      {successfullyParsedSections.length > 0 ? (
        <CourseReviewPreviewPanel
          errors={computationErrors}
          result={courseReviewResult}
          onCompute={computeResults}
        />
      ) : null}

      <CourseReviewReportDownloadPanel
        result={courseReviewResult}
        reportDetails={reportDetails}
      />
    </>
  );
}

function ParseSummary({
  parseState,
}: {
  parseState: ParsedSectionState | undefined;
}) {
  if (!parseState || parseState.status === "idle") {
    return <StatusBadge tone="neutral">Waiting to parse</StatusBadge>;
  }

  if (parseState.status === "parsing") {
    return <StatusBadge tone="info">Parsing</StatusBadge>;
  }

  if (parseState.status === "failed") {
    return (
      <div className="space-y-2">
        <StatusBadge tone="danger">Parse failed</StatusBadge>
        <p className="max-w-xl text-sm font-medium text-red-700">
          {parseState.errorMessage ?? "The spreadsheet could not be parsed."}
        </p>
      </div>
    );
  }

  if (!parseState.parsedSection) {
    return null;
  }

  const parsedSection = parseState.parsedSection;
  const validStudentCount = parsedSection.rows.filter(
    (row) => row.isValidStudent,
  ).length;
  const boundaryCodes = parsedSection.courseOutcomeBoundaries
    .map((column) => column.courseOutcomeCode)
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-2">
      <StatusBadge tone="success">Parsed successfully</StatusBadge>
      <p className="text-xs text-zinc-600">
        {validStudentCount} valid students •{" "}
        {parsedSection.assessmentColumns.length} assessment options •{" "}
        {boundaryCodes.length > 0
          ? `${boundaryCodes} boundaries`
          : "No CO boundaries"}
      </p>
    </div>
  );
}

function WorkflowProgress({
  uploadedCount,
  parsedCount,
  requiredMappingsSelected,
  hasReportDetails,
  reportDetailsAreFilled,
  hasPreview,
}: {
  uploadedCount: number;
  parsedCount: number;
  requiredMappingsSelected: boolean;
  hasReportDetails: boolean;
  reportDetailsAreFilled: boolean;
  hasPreview: boolean;
}) {
  const steps = [
    {
      label: "Upload Grade Spreadsheets",
      status: uploadedCount > 0 ? "complete" : "current",
      detail:
        uploadedCount > 0
          ? `${parsedCount}/${uploadedCount} parsed`
          : "Add section files",
    },
    {
      label: "Map Course Outcomes",
      status:
        parsedCount === 0
          ? "pending"
          : requiredMappingsSelected
            ? "complete"
            : "current",
      detail: requiredMappingsSelected ? "Ready" : "CO1 and CO2 required",
    },
    {
      label: "Report Details",
      status: !hasReportDetails
        ? "pending"
        : reportDetailsAreFilled
          ? "complete"
          : "current",
      detail: reportDetailsAreFilled ? "Filled" : "Header fields",
    },
    {
      label: "Preview Results",
      status: hasPreview
        ? "complete"
        : requiredMappingsSelected
          ? "current"
          : "pending",
      detail: hasPreview ? "Validated" : "Required before DOCX",
    },
    {
      label: "Download DOCX",
      status: hasPreview ? "current" : "pending",
      detail: hasPreview ? "Available" : "After preview",
    },
  ] as const;

  return (
    <section className="sticky top-0 z-20 -mx-4 border-y border-zinc-200 bg-zinc-100/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl gap-2 overflow-x-auto sm:grid sm:grid-cols-5">
        {steps.map((step, index) => (
          <div
            key={step.label}
            className={`min-w-56 rounded-md border px-3 py-2 sm:min-w-0 ${
              step.status === "current"
                ? "border-[#A6192E] bg-white"
                : step.status === "complete"
                  ? "border-[#D4AF37] bg-[#FFF8E1]"
                  : "border-zinc-200 bg-white"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border text-xs font-semibold ${
                  step.status === "complete"
                    ? "border-[#A6192E] bg-[#A6192E] text-white"
                    : step.status === "current"
                      ? "border-zinc-950 bg-zinc-950 text-white"
                      : "border-zinc-300 bg-zinc-50 text-zinc-500"
                }`}
              >
                {index + 1}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-zinc-950">
                  {step.label}
                </p>
                <p className="truncate text-[11px] text-zinc-600">
                  {step.detail}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function StatusBadge({
  tone,
  children,
}: {
  tone: "neutral" | "info" | "success" | "danger";
  children: ReactNode;
}) {
  const toneClassName = {
    neutral: "border-zinc-200 bg-zinc-50 text-zinc-600",
    info: "border-[#D4AF37] bg-[#FFF8E1] text-[#7A5B00]",
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
