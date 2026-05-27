# Test Cases

## Test Case 1 - Single Section Passed

Input:

- One spreadsheet
- 20 valid students
- CO1 selected assessment has 18 passing students

Expected result:

- Frequency = 18
- Percentage = 90.00
- Remarks = PASSED

## Test Case 2 - Single Section Failed

Input:

- One spreadsheet
- 20 valid students
- CO2 selected assessment has 13 passing students

Expected result:

- Frequency = 13
- Percentage = 65.00
- Remarks = FAILED

## Test Case 3 - Multiple Sections

Input:

- Three spreadsheets
- Each spreadsheet represents one section

Expected result:

- Three parsed sections are created
- Each section has its own editable section name
- Each section has its own CO mapping dropdowns
- Each section produces its own computed result table

## Test Case 4 - Per-Section Mapping

Input:

- Two spreadsheets
- Section 1 maps CO1 to Activity 1
- Section 2 maps CO1 to Assignment 1

Expected result:

- Each section uses its own selected assessment column
- Results are computed independently per section

## Test Case 5 - Blank Score

Input:

- One selected assessment column has a blank score for one student

Expected result:

- Blank score is treated as failed
- Student is included in the denominator

## Test Case 6 - Missing Mapping

Input:

- User uploads spreadsheet
- User does not select assessment column for CO1

Expected result:

- App prevents computation or report generation
- App shows a validation message explaining that CO1 mapping is required

## Test Case 7 - Edited Section Name

Input:

- Uploaded filename is CSS188-3_FOPM01_2T3031_fullgc.xls
- User edits section name to CSS188-3 FOPM01

Expected result:

- Preview uses edited section name
- Generated DOCX uses edited section name

## Test Case 8 - DOCX Export

Input:

- Valid computed course review result
- Valid DOCX template

Expected result:

- DOCX file downloads successfully
- Section names are correct
- Assessment tasks are correct
- Frequency values are correct
- Percentage values are correct
- Remarks are correct
- Recommendation column is blank

## Test Case 9 - Invalid Spreadsheet

Input:

- User uploads a file that cannot be parsed as a spreadsheet

Expected result:

- App shows an error message
- App does not crash
- User can remove the invalid file

## Test Case 10 - No Valid Students

Input:

- Spreadsheet has assessment columns but no valid student rows

Expected result:

- App shows a validation message
- App prevents computation
