"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";
import type { UploadedSpreadsheetFile } from "@/types/course-review";
import { inferSectionNameFromFileName } from "@/lib/spreadsheet/section-name";

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

export function SpreadsheetUploadWorkspace() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedSpreadsheetFile[]>(
    [],
  );
  const [isDragging, setIsDragging] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<UploadError[]>([]);

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
    setUploadErrors(
      rejectedFiles.map((file, index) => ({
        id: `${file.name}-${Date.now()}-${index}`,
        message: `${file.name} was skipped. Upload .xls or .xlsx files only.`,
      })),
    );
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
    setUploadedFiles((currentFiles) =>
      currentFiles.map((uploadedFile) =>
        uploadedFile.id === id ? { ...uploadedFile, sectionName } : uploadedFile,
      ),
    );
  }

  function removeFile(id: string) {
    setUploadedFiles((currentFiles) =>
      currentFiles.filter((uploadedFile) => uploadedFile.id !== id),
    );
  }

  return (
    <section className="w-full border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-200 px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-950">
              Upload Grade Spreadsheets
            </h2>
            <p className="text-sm text-zinc-600">
              Each Excel file will be treated as one course section.
            </p>
          </div>
          <div className="text-sm font-medium text-zinc-700">
            {uploadedFiles.length}{" "}
            {uploadedFiles.length === 1 ? "section" : "sections"}
          </div>
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-6">
        <div
          className={`flex min-h-44 flex-col items-center justify-center border-2 border-dashed px-4 py-8 text-center transition-colors ${
            isDragging
              ? "border-teal-500 bg-teal-50"
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
              You can upload one file or several section files at the same time.
            </p>
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center border border-zinc-900 bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose files
            </button>
          </div>
        </div>

        {uploadErrors.length > 0 ? (
          <div className="border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {uploadErrors.map((error) => (
              <p key={error.id}>{error.message}</p>
            ))}
          </div>
        ) : null}

        {uploadedFiles.length === 0 ? (
          <div className="border border-zinc-200 bg-white px-4 py-8 text-center">
            <h3 className="text-sm font-semibold text-zinc-950">
              No spreadsheets uploaded yet
            </h3>
            <p className="mt-1 text-sm text-zinc-600">
              Uploaded files will appear here as editable section entries.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-zinc-200">
            <table className="min-w-full divide-y divide-zinc-200 text-left text-sm">
              <thead className="bg-zinc-50 text-xs font-semibold uppercase text-zinc-600">
                <tr>
                  <th className="px-4 py-3">File</th>
                  <th className="px-4 py-3">Section Name</th>
                  <th className="w-28 px-4 py-3">Size</th>
                  <th className="w-24 px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white">
                {uploadedFiles.map((uploadedFile) => {
                  const sectionNameIsMissing =
                    uploadedFile.sectionName.trim().length === 0;

                  return (
                    <tr key={uploadedFile.id}>
                      <td className="max-w-xs px-4 py-3 align-top">
                        <p className="break-words font-medium text-zinc-950">
                          {uploadedFile.fileName}
                        </p>
                      </td>
                      <td className="min-w-72 px-4 py-3 align-top">
                        <label className="sr-only" htmlFor={uploadedFile.id}>
                          Section name for {uploadedFile.fileName}
                        </label>
                        <input
                          id={uploadedFile.id}
                          type="text"
                          value={uploadedFile.sectionName}
                          className={`h-10 w-full border px-3 text-sm text-zinc-950 outline-none transition focus:border-teal-600 ${
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
                      <td className="whitespace-nowrap px-4 py-3 align-top text-zinc-600">
                        {formatFileSize(uploadedFile.file.size)}
                      </td>
                      <td className="px-4 py-3 text-right align-top">
                        <button
                          type="button"
                          className="h-9 border border-zinc-300 px-3 text-sm font-medium text-zinc-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
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
  );
}
