## Phase 1 - Project Setup

Set up the project using:

- Next.js
- TypeScript
- Tailwind CSS

Install libraries:

- SheetJS for spreadsheet parsing
- Docxtemplater for DOCX generation
- PizZip for loading DOCX templates

Recommended folders:

```txt
src/
├─ app/
├─ components/
│  ├─ upload/
│  ├─ mapping/
│  ├─ preview/
│  └─ report/
├─ lib/
│  ├─ spreadsheet/
│  ├─ course-review/
│  └─ docx/
└─ types/
```

## Phase 2 - Shared Types

Create shared TypeScript types for:

- Uploaded spreadsheet file
- Parsed section
- Spreadsheet column
- Spreadsheet row
- CO mapping
- Section result
- Course review result

Keep types in:

```txt
src/types/course-review.ts
```

## Phase 3 - Multiple Spreadsheet Upload

Implement multiple spreadsheet upload.

Requirements:

- User can upload one or more spreadsheet files.
- Each spreadsheet becomes one section.
- Show uploaded files in the UI.
- Allow file removal before computation.
- Infer section name from filename.
- Allow user to manually edit section name.

Do not implement DOCX generation yet.

## Phase 4 - Spreadsheet Parsing

Implement spreadsheet parsing using SheetJS.

For each uploaded file:

- Read the file.
- Extract rows.
- Detect the header row.
- Extract columns.
- Mark possible assessment columns.
- Extract student rows.
- Store parsed data as a ParsedSection.

Keep parsing logic in:

```txt
src/lib/spreadsheet/
```

The parser does not need to be perfect immediately. Prefer a clear implementation with fallback behavior over complicated guessing.

## Phase 5 - Per-Section CO Mapping UI

Create a mapping UI grouped by section.

For each section, the user should select assessment columns for:

- CO1
- CO2
- CO3

The UI should show the detected assessment columns as dropdown options.

For MVP:

- Mapping is done per section.
- Do not add same mapping for all sections.
- Do not add reusable mappings.
- Do not use AI to guess mappings.

## Phase 6 - Computation Engine

Implement pure TypeScript computation functions.

Required functions:

- `getNumericScore`
- `countPassedStudents`
- `computePercentagePassed`
- `computeRemarks`
- `computeOutcomeResult`
- `computeSectionResult`
- `computeCourseReviewResult`

Keep computation logic in:

```txt
src/lib/course-review/
```

The computation logic must not depend on React components.

Default rules:

- Minimum satisfactory score = 70%
- Target passed percentage = 70%
- Blank score = failed
- Percentage rounded to two decimal places

## Phase 7 - Preview UI

Create a simple preview screen.

The preview must group computed results by section.

Each section preview should show:

- Course Outcome
- Assessment Task
- Min. Satisfactory %
- Target Passed %
- Frequency
- Percentage
- Remarks
- Recommendation blank

The preview is required before DOCX generation.

The preview is not a full report editor.

## Phase 8 - DOCX Template Generation

Implement DOCX generation after preview is working.

Use:

- Docxtemplater
- PizZip

Use a placeholder-based DOCX template.

The template should support repeated sections.

The generated report should fill:

- Section name
- CO rows
- Assessment task
- Min. satisfactory percentage
- Target passed percentage
- Frequency
- Percentage
- Remarks

The recommendation field must stay blank.

Keep DOCX logic in:

```txt
src/lib/docx/
```

## Phase 9 - Error Handling and Validation

Add validation before computation:

- No files uploaded
- Empty spreadsheet
- Missing section name
- Missing CO mapping
- Selected column not found
- Non-numeric scores
- No valid student rows

Add validation before DOCX generation:

- Preview not generated
- Missing computed results
- Missing DOCX template
- Invalid template

## Phase 10 - Testing and Final Cleanup

Test with:

- One spreadsheet
- Multiple spreadsheets
- Passed CO result
- Failed CO result
- Blank scores
- Missing mapping
- Wrong file type
- Edited section name
- DOCX generation

After testing:

- Clean up unused code
- Improve labels and UI copy
- Add simple usage instructions
