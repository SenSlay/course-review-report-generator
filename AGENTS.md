# Course Review Report Generator

## Project Summary

This project is a web-based tool that helps automate course review report preparation.

The app allows users to upload one or more student grade spreadsheets, treat each spreadsheet as one section, manually map assessment/activity columns to Course Outcomes for each section, compute frequency, percentage, and PASSED/FAILED remarks, preview the computed results, and generate a filled DOCX course review report.

## Main Goal

Build a reliable no-cost course review report automation tool.

Do not use LLM APIs for computation, report generation, recommendations, or column guessing. The system must use deterministic spreadsheet parsing, user-selected mappings, and document generation.

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- SheetJS for spreadsheet parsing
- Docxtemplater and PizZip for DOCX generation
- Browser state/local state for MVP

## Development Rules

- When the user is discussing, planning, asking questions, or reviewing options, do not make code or documentation changes unless the user explicitly asks for changes.
- Use TypeScript.
- Keep computation logic deterministic and testable.
- Do not send student grade data to external APIs.
- Do not add authentication.
- Do not add a database unless explicitly requested.
- Do not add reusable CO mappings for MVP.
- Do not add global mapping across all sections for MVP.
- Do not auto-fill recommendations.
- Prioritize correctness over UI polish.
- Separate spreadsheet parsing, computation, mapping, preview, and DOCX generation logic.
- Keep modules small and readable.
- Preserve existing behavior when refactoring.

## Core Data Flow

Upload one or more grade spreadsheets
→ Treat each spreadsheet as one section
→ Parse spreadsheet rows and assessment columns
→ User confirms or edits section name
→ User maps assessment columns to Course Outcomes per section
→ System computes frequency, percentage, and remarks per section
→ System shows a simple preview table
→ User generates filled DOCX report

## Important Rules

1. Never guess which assessment belongs to a Course Outcome.
2. The user must manually select the assessment/activity column for each CO in each section.
3. Recommendations must remain blank.
4. The preview screen is required as a validation step before DOCX generation.
5. Multiple spreadsheet upload and multiple section support are part of MVP.
