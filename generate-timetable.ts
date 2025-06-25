import {
  analyzeTimetables,
  CourseCode,
  CourseIndexSchedule,
  nextEvolution,
  printTimetable,
  Timetable,
} from "./genetic-planner";
import path from "path";
import fs from "fs";
import { CourseListSchema } from "./schema";
import { doesTimeslotOverlap, Timeslot } from "./utils";

const MAX_EVOLUTIONS = 100;

const resultsPath = path.resolve(__dirname, "all-results.json");
const allCourseRawSchedule = CourseListSchema.parse(
  JSON.parse(fs.readFileSync(resultsPath, "utf8"))
);

const wantCourseCodes = ["SC2001", "SC2005", "SC2203", "SC2006", "SC2008"];

const wantCourses = allCourseRawSchedule.filter((course) =>
  wantCourseCodes.includes(course.course)
);

const courseIndexScheduleMap: Map<CourseCode, CourseIndexSchedule[]> =
  new Map();
for (const course of wantCourses) {
  const courseIndexSchedules: CourseIndexSchedule[] = [];
  for (const index of course.indices) {
    const timeslots: Timeslot[] = [];
    if (!index.sources.includes("Computer Science Year 2")) {
      continue;
    }
    if (
      course.course === "SC2001" &&
      (index.index === "10193" ||
        index.index === "10148" ||
        index.index === "10147" ||
        index.index === "10153")
    ) {
      continue;
    }
    for (const _class of index.classes) {
      const findOverlappingTimeslot = timeslots.find((timeslot) =>
        doesTimeslotOverlap(timeslot, {
          day: _class.day,
          from: _class.timeFrom,
          to: _class.timeTo,
          type: _class.type,
          weeks: _class.weeks,
        })
      );
      if (findOverlappingTimeslot) {
        if (findOverlappingTimeslot.type === _class.type) {
          //   console.log(
          //     `Course ${course.course} Index ${index.index} Timeslot ${findOverlappingTimeslot.type} ${findOverlappingTimeslot.day} ${findOverlappingTimeslot.from.hour}:${findOverlappingTimeslot.from.minute} - ${findOverlappingTimeslot.to.hour}:${findOverlappingTimeslot.to.minute} overlaps with existing timeslot ${_class.type} ${_class.day} ${_class.timeFrom.hour}:${_class.timeFrom.minute} - ${_class.timeTo.hour}:${_class.timeTo.minute}`
          //   );
          continue;
        }
        throw new Error("Timeslot overlaps with existing timeslot");
      }
      timeslots.push({
        day: _class.day,
        from: _class.timeFrom,
        to: _class.timeTo,
        type: _class.type,
        weeks: _class.weeks,
      });
    }
    courseIndexSchedules.push({
      course: course.course,
      index: index.index,
      timeslots,
    });
  }
  courseIndexScheduleMap.set(course.course, courseIndexSchedules);
}

let rankedRestrictiveCourses = Array.from(courseIndexScheduleMap.values());
rankedRestrictiveCourses.sort((a, b) => {
  return a.length - b.length;
});

let currentGenTimetables: Timetable[] = nextEvolution([], {
  mutationProbability: 0,
  numberOfTimetables: 200,
  courses: courseIndexScheduleMap,
});
for (let i = 0; i < MAX_EVOLUTIONS; i++) {
  currentGenTimetables = nextEvolution(currentGenTimetables, {
    mutationProbability: 0.3,
    numberOfTimetables: 200,
    courses: courseIndexScheduleMap,
  });
  const analysis = analyzeTimetables(currentGenTimetables);
  console.log(`Evolution ${i}`);
  console.log(analysis);
  printTimetable(analysis.bestTimetable, { precision: "30m" });
  console.log(
    Object.entries(analysis.bestTimetable.courses)
      .map(([courseCode, course]) => `${courseCode} ${course.index}`)
      .join(", ")
  );
}
