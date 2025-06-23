import fs from "fs";
import path from "path";
import {
  Class,
  Course,
  CourseListSchema,
  CourseSchema,
  Day,
  Time,
  TypeSchema,
} from "./schema";
import { z } from "zod";

type Timeslot = {
  day: Day;
  from: Time;
  to: Time;
  type: z.infer<typeof TypeSchema>;
};

function doesTimeslotOverlap(timeslot1: Timeslot, timeslot2: Timeslot) {
  if (timeslot1.day !== timeslot2.day) {
    return false;
  }
  const fromTime = timeslot1.from.hour * 60 + timeslot1.from.minute;
  const toTime = timeslot1.to.hour * 60 + timeslot1.to.minute;
  const otherFromTime = timeslot2.from.hour * 60 + timeslot2.from.minute;
  const otherToTime = timeslot2.to.hour * 60 + timeslot2.to.minute;
  if (fromTime > otherToTime || toTime < otherFromTime) {
    return false;
  }
  return true;
}

function toSeconds(time: Time) {
  return time.hour * 60 + time.minute;
}

type CourseCode = string;

type CourseIndexSchedule = {
  course: CourseCode;
  index: string;
  timeslots: Timeslot[];
};

const resultsPath = path.resolve(__dirname, "results.json");
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
    for (const _class of index.classes) {
      const findOverlappingTimeslot = timeslots.find((timeslot) =>
        doesTimeslotOverlap(timeslot, {
          day: _class.day,
          from: _class.timeFrom,
          to: _class.timeTo,
          type: _class.type,
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

type Timetable = {
  courses: {
    [courseCode: string]: {
      index: string;
      timeslots: Timeslot[];
    };
  };
};

export function evaluateTimetable(timetable: Timetable) {
  const dayTimeSlotMap = new Map<Day, Timeslot[]>();

  // First, we need to map the timeslots to the day
  for (const course of Object.values(timetable.courses)) {
    for (const timeslot of course.timeslots) {
      const dayTimeSlot = dayTimeSlotMap.get(timeslot.day);
      if (dayTimeSlot) {
        dayTimeSlot.push(timeslot);
      } else {
        dayTimeSlotMap.set(timeslot.day, [timeslot]);
      }
    }
  }

  // Before we continue, lets sort the timeslots by time
  for (const [day, dayTimeSlot] of dayTimeSlotMap.entries()) {
    const sorted = dayTimeSlot.sort((a, b) => {
      return toSeconds(a.from) - toSeconds(b.from);
    });
    dayTimeSlotMap.set(day, sorted);
  }

  // Next, we check if there are any timeslots that overlap
  for (const dayTimeSlot of dayTimeSlotMap.values()) {
    let lastTimeSlot: Timeslot | null = null;
    for (const timeslot of dayTimeSlot) {
      if (
        lastTimeSlot &&
        toSeconds(lastTimeSlot.to) > toSeconds(timeslot.from)
      ) {
        return -1;
      }
      lastTimeSlot = timeslot;
    }
  }

  return 0;
}

console.log(
  evaluateTimetable({
    courses: {
      SC2001: {
        index: "1",
        timeslots: [
          {
            day: "MON",
            from: { hour: 10, minute: 0 },
            to: { hour: 11, minute: 0 },
            type: "LEC",
          },
        ],
      },
      SC2005: {
        index: "1",
        timeslots: [
          {
            day: "TUE",
            from: { hour: 10, minute: 0 },
            to: { hour: 11, minute: 0 },
            type: "LEC",
          },
        ],
      },
    },
  })
);

// function calcIndexFlexibilityScore(
//   index: CourseIndexSchedule,
//   compare: {
//     course: CourseCode;
//     indices: CourseIndexSchedule[];
//   }[]
// ) {
//   let overlaps = 0;
// }

// function generateTimetable(): Timetable {
//   const timetable: Timetable = {
//     courses: {},
//   };

//   return timetable;
// }

// console.log(rankedRestrictiveCourses);

// console.log(JSON.stringify(wantCourses, null, 2));
