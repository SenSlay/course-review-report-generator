# Data and Computation Rules

## Main Assumptions

1. One spreadsheet represents one course section.
2. Multiple spreadsheets can be uploaded for one course review report.
3. Required Course Outcomes CO1 and CO2 are each evaluated using one selected assessment/activity column.
4. CO3 is optional and is evaluated only when the user selects a CO3 assessment/activity column.
5. The user manually selects assessment/activity columns; the system must not guess mappings.
6. Minimum satisfactory score is 70%.
7. Target percentage of students passed is 70%.
8. Recommendations are not auto-filled.
9. The generated report should include one course outcome table per section.
10. Grade Center `.xls` exports may be UTF-16 tab-delimited text files.
11. `CO1 Grade`, `CO2 Grade`, and `CO3 Grade` columns mark Course Outcome assessment groups when present.
12. Grade Center filenames may include report metadata tokens such as `2T3031`, where `2T` is the quarter and `3031` becomes academic year `2030-2031`.

## Spreadsheet Export Format

The parser must support normal spreadsheet files and Grade Center-style exports that use `.xls` filenames but contain UTF-16 tab-delimited text.

For Grade Center exports:

- The first row is expected to contain headers.
- Student metadata columns may include Last Name, First Name, Username, Student ID, Last Access, and Availability.
- Graded columns usually include total-point metadata in the header, such as `[Total Pts: 100 Score]`.
- Grade Center column IDs may appear after a pipe character, such as `|2825849`.

## Course Outcome Mapping

Mapping is done per section.
CO1 and CO2 mappings are required. CO3 mapping is optional and should be left blank when the course does not use CO3.

Example:

Section: CSS188-3 FOPM01

- CO1 → Activity 1
- CO2 → Quiz 2
- CO3 → Final Project

Section: CSS188-3 FOPM02

- CO1 → Assignment 1
- CO2 → Quiz 3
- CO3 → Project Task

For MVP, do not implement:

- Same mapping for all sections
- Reusable saved mappings
- Auto-mapping using AI

## Course Outcome Boundary Columns

When present, `CO1 Grade`, `CO2 Grade`, and `CO3 Grade` columns act as boundary markers for grouping assessment options.

Default grouping rule:

- Assessment columns before `CO1 Grade` belong to the CO1 group.
- Assessment columns after `CO1 Grade` and before `CO2 Grade` belong to the CO2 group.
- Assessment columns after `CO2 Grade` and before `CO3 Grade` belong to the CO3 group.
- Assessment columns after `CO3 Grade` should not be assigned to a CO group unless a future rule explicitly supports it.

These groups are only UI guidance. The user must still manually select the assessment/activity column for each required Course Outcome, and may manually select CO3 when applicable.

## Student Counting

Default rule:

- Include valid/enrolled students in the denominator.
- Treat blank scores as failed unless a future setting changes this behavior.

Reason:

If the selected assessment is the official Course Outcome assessment and the student has no score, the student did not satisfy the outcome.

## Future Blank Score Option

A future version may allow users to choose:

1. Treat blank scores as failed
2. Exclude blank scores from total students

For MVP, use:

Blank score = failed

## Passing Logic

If the assessment column is already a percentage:

studentPassed = studentScore >= 70

If the assessment column has total points:

passingScore = totalPoints * 0.70

studentPassed = studentScore >= passingScore

If the system cannot confidently detect total points, the UI should show the selected column and allow manual verification later.

## Frequency

Frequency is the number of students who passed the selected assessment.

Example:

If 18 students out of 20 passed:

Frequency = 18

## Percentage

Percentage = Frequency / Total Valid Students * 100

Round percentage to two decimal places.

Example:

18 / 20 * 100 = 90.00%

## Remarks

If percentage >= 70:

Remarks = PASSED

Otherwise:

Remarks = FAILED

## Recommendation

Recommendation should always be blank in the generated report.

Course reviewers will manually input recommendations if needed.

## Internal Data Shape

Use this shape internally or something very close to it:

```ts
export type CourseReview = {
  courseCode: string;
  courseTitle?: string;
  academicYear?: string;
  quarter?: string;
  sections: SectionResult[];
};

export type SectionResult = {
  id: string;
  sectionName: string;
  fileName: string;
  totalStudents: number;
  outcomes: OutcomeResult[];
};

export type OutcomeResult = {
  coCode: string;
  assessmentTask: string;
  minSatisfactoryPercent: number;
  targetPassedPercent: number;
  frequencyPassed: number;
  percentagePassed: number;
  remarks: "PASSED" | "FAILED";
  recommendation: "";
};
