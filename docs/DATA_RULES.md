# Data and Computation Rules

## Main Assumptions

1. One spreadsheet represents one course section.
2. Multiple spreadsheets can be uploaded for one course review report.
3. Each Course Outcome is evaluated using one selected assessment/activity column.
4. The user manually selects the assessment/activity column for each Course Outcome.
5. Minimum satisfactory score is 70%.
6. Target percentage of students passed is 70%.
7. Recommendations are not auto-filled.
8. The generated report should include one course outcome table per section.

## Course Outcome Mapping

Mapping is done per section.

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
