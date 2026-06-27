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

## Test Case 6A - Optional CO3 Mapping

Input:

- User uploads spreadsheet
- User selects valid CO1 and CO2 assessment columns
- User leaves CO3 blank

Expected result:

- App allows preview generation
- Computed section result includes CO1 and CO2 only
- Generated DOCX does not require a CO3 row

## Test Case 7 - Edited Section Name

Input:

- Uploaded filename is gc_CSS188-3_FOPM01_2T3031_fullgc_2030-05-18-09-57-51.xls
- System infers section name as FOPM01
- System infers quarter as 2T
- System infers academic year as 2030-2031
- User may edit section name if needed

Expected result:

- Preview uses the confirmed section name
- Report details show the inferred quarter and academic year unless the user edits them
- Generated DOCX uses the confirmed section name

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

## Test Case 11 - Grade Center Text Export

Input:

- Uploaded file has `.xls` extension
- File content is UTF-16 tab-delimited Grade Center export

Expected result:

- App parses the file successfully
- Header row is detected
- Student rows are extracted
- Assessment columns are extracted
- App does not crash because the file is not a binary Excel workbook

## Test Case 12 - CO Boundary Detection

Input:

- Spreadsheet includes `CO1 Grade`, `CO2 Grade`, and `CO3 Grade` columns
- Assessment columns appear before and between those CO grade columns

Expected result:

- Columns before `CO1 Grade` are grouped under CO1
- Columns after `CO1 Grade` and before `CO2 Grade` are grouped under CO2
- Columns after `CO2 Grade` and before `CO3 Grade` are grouped under CO3
- CO boundary grouping does not automatically select a mapping

## Test Case 13 - Grouped Mapping Options

Input:

- User opens mapping UI after parsing a spreadsheet with CO boundary columns

Expected result:

- CO1 mapping dropdown shows CO1-group assessment options
- CO2 mapping dropdown shows CO2-group assessment options
- CO3 mapping dropdown shows CO3-group assessment options
- User can still manually choose the correct assessment column

## Test Case 14 - DOCX Template Compatibility

Input:

- Valid computed course review result
- App-ready DOCX template with placeholders

Expected result:

- Template renders without placeholder errors
- Repeated section data is generated correctly
- Recommendation column remains blank
