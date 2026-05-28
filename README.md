# Course Review Report Generator

A browser-local tool for preparing course review report outcome tables from Grade Center spreadsheet exports.

Live app: https://course-review-report-generator.vercel.app/

## What It Does

- Upload one `.xls` or `.xlsx` grade spreadsheet per section.
- Infer section names and course codes from Grade Center filenames when possible.
- Let the user manually map CO1, CO2, and CO3 to assessment columns per section.
- Compute frequency, percentage, and PASSED/FAILED remarks deterministically.
- Show a preview before report generation.
- Generate a filled DOCX report from the app-ready course review template.

Student data stays in the browser. The app does not use LLM APIs, external computation services, authentication, or a database.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## MVP Workflow

1. Upload Grade Center exports, using one spreadsheet for each section.
2. Confirm or edit the detected section name for each uploaded file.
3. Select one assessment column for CO1, CO2, and CO3 in every section.
4. Fill or edit the report header details.
5. Generate the preview and check the computed values.
6. Download the DOCX report.

Recommendations are intentionally left blank in the preview and generated DOCX.

## Verification

Run the automated checks before shipping changes:

```bash
npm test
npm run lint
npm run build
```

Manual QA should include single-section upload, multiple-section upload, Grade Center UTF-16 `.xls` export parsing, missing mapping validation, edited section names, DOCX download, and opening the generated DOCX in Word or LibreOffice.
