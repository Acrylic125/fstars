# AY 26/27 Semester 2

## Intent

Add the semester dates from the academic calendar supplied by the user.

## Surfaces

`src/lib/acad.ts` supplies week dates to timetable exports and week lookup to calendar selectors and vacant classrooms.

## Impact

Use the existing Sunday-to-Saturday convention. Teaching weeks run from 10 January to 17 April 2027, with recess from 28 February to 6 March. Include only the 13 teaching weeks shown in the supplied calendar, as requested by the user.

The semester lookup covers the full teaching weeks, Sunday 10 January through Saturday 17 April, following the existing week convention and the user’s correction. Recess returns semester metadata without a week number. Dates outside these bounds return no semester. Week 14 is excluded from this semester. The current semester setting is AY 26/27 Semester 2, as subsequently requested by the user. This sets defaults for timetable creation, timetable previews, and venue pages.
