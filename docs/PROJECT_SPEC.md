# Course Review Report Generator - Project Specification

## Overview

The Course Review Report Generator is a web-based system that automates parts of the course review report preparation process.

The system processes student grade spreadsheets, allows users to map assessment/activity columns to Course Outcomes, computes required course outcome results, shows a preview of the computed results, and generates a filled DOCX course review report based on the official template.

## Problem

Course reviewers manually compute how many students passed selected assessment tasks for each Course Outcome. They also manually fill the course review template with the assessment task, frequency, percentage, and pass/fail remarks.

This process is repetitive, time-consuming, and prone to computation or formatting errors.

## Main Users

- Course reviewers
- Instructors
- Program or cluster representatives
- Academic staff handling course review documentation

## MVP Scope

The MVP should support:

1. Multiple spreadsheet upload
2. One spreadsheet per section
3. Section name detection from filename
4. Manual section name editing
5. Per-section Course Outcome mapping
6. Computation of frequency, percentage, and remarks
7. Simple preview table
8. DOCX course review report generation

## Core Features

### 1. Multiple Spreadsheet Upload

Users can upload one or more grade spreadsheets.

Each spreadsheet represents one course section.

Example:

- CSS188-3_FOPM01.xls
- CSS188-3_FOPM02.xls
- CSS188-3_FOPM03.xls

Each uploaded file should become one section in the app.

### 2. Section Detection

The system should infer the section name from the uploaded filename when possible.

The user should be able to manually edit the section name before generating the report.

Example:

Filename:

CSS188-3_FOPM01_2T3031_fullgc.xls

Possible detected section name:

FOPM01

### 3. Spreadsheet Parsing

The system should parse uploaded spreadsheets and extract:

- Student rows
- Assessment/activity columns
- Scores
- Possible total points if available
- Column labels

The parser should be designed to handle spreadsheet exports where files may use `.xls` but contain tabular or exported data.

Grade Center exports may use an `.xls` extension while the actual file content is UTF-16 tab-delimited text. The parser must support this export shape.

### 4. Assessment Column Detection

The system should detect possible assessment/activity columns from the spreadsheet.

Assessment columns may include:

- Assignments
- Activities
- Quizzes
- Seatworks
- Projects
- Exams
- CO grade columns
- Other graded tasks

The system should not automatically decide which assessment belongs to a Course Outcome.

If the spreadsheet includes `CO1 Grade`, `CO2 Grade`, or `CO3 Grade` columns, those columns should be treated as Course Outcome boundary markers. Assessment columns before `CO1 Grade` belong to the CO1 group, assessment columns between `CO1 Grade` and `CO2 Grade` belong to the CO2 group, and assessment columns between `CO2 Grade` and `CO3 Grade` belong to the CO3 group.

Boundary detection may be used to group assessment options in the UI, but it must not auto-select a mapping.

### 5. Per-Section Course Outcome Mapping

For each uploaded section, the user must select which assessment/activity column belongs to each Course Outcome.

Example:

Section: CSS188-3 FOPM01

- CO1 → Activity 1
- CO2 → Quiz 2
- CO3 → Final Project

Section: CSS188-3 FOPM02

- CO1 → Assignment 1
- CO2 → Machine Learning Quiz
- CO3 → Predictive Modeling Project

Mappings are per section only for MVP.

Do not implement same-mapping-across-all-sections.

Do not implement reusable saved mappings.

### 6. Computation

For each Course Outcome in each section, compute:

- Frequency of students who passed
- Percentage of students who passed
- PASSED or FAILED remarks

Default criteria:

- Minimum satisfactory score: 70%
- Target percentage passed: 70%

### 7. Preview

Before generating the DOCX report, the app must show a simple preview table.

The preview should show computed results grouped by section.

Each section preview should show:

- Course Outcome
- Selected assessment task
- Minimum satisfactory percentage
- Target passed percentage
- Frequency
- Percentage
- Remarks
- Blank recommendation

The preview exists only as a validation step.

It does not need to be a full document editor.

### 8. DOCX Report Generation

The system should generate a filled DOCX course review report using the official template.

The generated report should contain one course outcome table per uploaded section.

The report should fill:

- Section name
- Course Outcome rows
- Assessment task
- Minimum satisfactory percentage
- Target passed percentage
- Frequency
- Percentage
- Remarks

The Recommendation column should remain blank.

The official DOCX file may need an app-ready placeholder copy for Docxtemplater. If preserving the official template through placeholders becomes impractical, the app may generate the required result tables programmatically while keeping the same data and leaving recommendations blank.

## Sample Files

Local sample files may be stored under:

- `samples/grades/`
- `samples/templates/`

Sample grade files should preferably be anonymized. These files are for local development, parser validation, and template validation.

## Out of Scope for MVP

Do not implement these unless explicitly requested later:

- LLM-generated reports
- LLM-generated recommendations
- LLM-based column guessing
- Authentication
- Database storage
- Cloud upload/storage
- Same mapping for all sections
- Reusable CO mappings
- Saved report history
- PDF export
- Advanced analytics
- Full report editor
- Automatic perfect assessment-to-CO mapping

## Future Features

Possible later features:

- Reusable CO mappings per course
- Same mapping across sections
- Per-section mapping override presets
- PDF export
- Saved report history
- Batch ZIP export
- Better validation reports
- Better DOCX template editor
