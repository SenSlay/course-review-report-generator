import { SpreadsheetUploadWorkspace } from "@/components/upload/spreadsheet-upload-workspace";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-6 text-zinc-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="border-b border-[#A6192E] pb-5">
          <h1 className="text-2xl font-semibold text-zinc-950 sm:text-3xl">
            Course Review Report Generator
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-700">
            Upload section grade spreadsheets, map Course Outcomes manually,
            preview the computed results, and generate the DOCX report locally.
          </p>
          <div className="mt-4 h-1 w-24 bg-[#D4AF37]" />
        </header>

        <SpreadsheetUploadWorkspace />
      </div>
    </main>
  );
}
