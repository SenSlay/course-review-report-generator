import { SpreadsheetUploadWorkspace } from "@/components/upload/spreadsheet-upload-workspace";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-zinc-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="border-b border-slate-300 pb-5">
          <p className="text-sm font-semibold uppercase text-teal-700">
            Course Review Report Generator
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-950 sm:text-3xl">
            Prepare Course Review Sections
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-700">
            Upload the grade spreadsheets for each section, confirm the detected
            section names, and prepare them for outcome mapping in the next
            step.
          </p>
        </header>

        <SpreadsheetUploadWorkspace />
      </div>
    </main>
  );
}
