import fs from "fs";
import path from "path";
import {
  Class,
  Course,
  CourseListSchema,
  CourseSchema,
  Day,
  Days,
  Time,
  TypeSchema,
} from "./schema";
import { z } from "zod";
import seedrandom from "seedrandom";

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

function analyzeTimetables(timetables: Timetable[]) {
  const scores = timetables.map((timetable) => evaluateTimetable(timetable));
  const numberOfFailures = scores.filter((score) => score === -1).length;
  const numberOfSuccesses = scores.filter((score) => score !== -1).length;
  const meanScoreOfSuccesses =
    scores.filter((score) => score !== -1).reduce((a, b) => a + b, 0) /
    numberOfSuccesses;
  const bestScore = Math.max(...scores);
  const bestTimetable = timetables[scores.indexOf(bestScore)];
  return {
    numberOfFailures,
    numberOfSuccesses,
    meanScoreOfSuccesses,
    bestScore,
    bestTimetable,
  };
}

function printTimetable(
  timetable: Timetable,
  options: {
    precision: "30m" | "1h";
  }
) {
  const map = new Array<Array<string>>(7);
  const s = options.precision === "30m" ? 48 : 24;
  const precision = options.precision === "30m" ? 30 : 60;
  for (let i = 0; i < 7; i++) {
    map[i] = new Array<string>(s);
    for (let j = 0; j < s; j++) {
      map[i][j] = " ";
    }
  }

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

  for (let i = 0; i < Days.length; i++) {
    const day = Days[i];
    const dayTimeSlot = dayTimeSlotMap.get(day);
    if (dayTimeSlot) {
      for (const timeslot of dayTimeSlot) {
        let start =
          (timeslot.from.hour * 60 + timeslot.from.minute) / precision;
        let end = (timeslot.to.hour * 60 + timeslot.to.minute) / precision;
        // To integer
        start = Math.floor(start);
        end = Math.floor(end);
        for (let j = start; j < end; j++) {
          map[i][j] = "X";
        }
      }
    }
  }

  for (let i = 0; i < map.length; i++) {
    for (let j = 0; j < map[i].length; j++) {
      process.stdout.write(map[i][j]);
    }
    console.log();
  }
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

  let score = 0;
  // Next, we check if there are any timeslots that overlap
  for (const dayTimeSlot of dayTimeSlotMap.values()) {
    let lastTimeSlot: Timeslot | null = null;
    let curConsecutiveTimeInSeconds = 0;
    let consecutiveStart = false;

    for (const timeslot of dayTimeSlot) {
      if (
        lastTimeSlot &&
        toSeconds(lastTimeSlot.to) > toSeconds(timeslot.from)
      ) {
        return -1;
      }

      if (lastTimeSlot) {
        // Check if this timeslot is consecutive with the last one
        // Consider slots consecutive if gap is <= 30 mins
        const gap = toSeconds(timeslot.from) - toSeconds(lastTimeSlot.to);
        if (gap <= 30) {
          if (!consecutiveStart) {
            consecutiveStart = true;
            curConsecutiveTimeInSeconds =
              toSeconds(lastTimeSlot.to) - toSeconds(lastTimeSlot.from);
          }
          curConsecutiveTimeInSeconds +=
            toSeconds(timeslot.to) - toSeconds(timeslot.from);
        } else {
          // Gap too large, check previous consecutive block if any
          if (consecutiveStart) {
            if (curConsecutiveTimeInSeconds <= 180 * 60) {
              // 3 hours
              score += 40;
            } else if (curConsecutiveTimeInSeconds <= 240 * 60) {
              // 4 hours
              score += 20;
            }
            consecutiveStart = false;
            curConsecutiveTimeInSeconds = 0;
          }
        }
      }

      lastTimeSlot = timeslot;
    }

    // Check final consecutive block
    if (consecutiveStart) {
      if (curConsecutiveTimeInSeconds <= 180 * 60) {
        // 3 hours
        score += 40;
      } else if (curConsecutiveTimeInSeconds <= 240 * 60) {
        // 4 hours
        score += 20;
      }
    }
  }

  // If the day has only 1 class, then fuck that. Its getting a 0.
  // If there are no timeslots for a day, we add 100 to the score
  // If the day starts after 10:00, we add 30 to the score
  // If the day ends before 14:00, we add 60 to the score. Else if before 17:00, we add 30 to the score
  for (const day of Days) {
    const dayTimeSlot = dayTimeSlotMap.get(day);
    if (dayTimeSlot && dayTimeSlot.length > 0) {
      if (dayTimeSlot.length === 1) {
        continue;
      }

      const firstTimeSlot = dayTimeSlot[0];
      if (firstTimeSlot.from.hour > 10) {
        score += 40;
      }
      const lastTimeSlot = dayTimeSlot[dayTimeSlot.length - 1];
      if (lastTimeSlot.to.hour < 14) {
        score += 60;
      } else if (lastTimeSlot.to.hour < 17) {
        score += 30;
      }
    } else {
      score += 120;
    }
  }

  return score;
}

// Set random seed
const rng = seedrandom("abcdefghijklmnopqrstuvwxyz");

let currentGenTimetables: Timetable[] = [];
for (let i = 0; i < 200; i++) {
  const timetable: Timetable = {
    courses: {},
  };
  for (const course of wantCourses) {
    const courseIndexSchedules = courseIndexScheduleMap.get(course.course);
    if (!courseIndexSchedules) {
      throw new Error(`Course ${course.course} not found`);
    }
    const randomIndex = Math.floor(rng.quick() * courseIndexSchedules.length);
    const courseIndexSchedule = courseIndexSchedules[randomIndex];
    timetable.courses[course.course] = {
      index: courseIndexSchedule.index,
      timeslots: courseIndexSchedule.timeslots,
    };
  }
  currentGenTimetables.push(timetable);
  console.log(evaluateTimetable(timetable));
}

function nextEvolution(
  timetables: Timetable[],
  options: {
    mutationProbability: number;
    numberOfTimetables: number;
  }
): Timetable[] {
  const scores = timetables.map((timetable) => evaluateTimetable(timetable));
  const rankedTimetables = timetables.sort((a, b) => {
    return scores[timetables.indexOf(b)] - scores[timetables.indexOf(a)];
  });
  const N = 6;
  const parents = rankedTimetables.slice(0, N);
  const children: Timetable[] = [];
  for (let i = 0; i < options.numberOfTimetables; i++) {
    const child: Timetable = {
      courses: {},
    };
    for (const course of wantCourses) {
      const courseIndexSchedules = courseIndexScheduleMap.get(course.course);
      if (!courseIndexSchedules) {
        throw new Error(`Course ${course.course} not found`);
      }
      if (rng.quick() < options.mutationProbability || parents.length <= 0) {
        const randomIndex = Math.floor(
          rng.quick() * courseIndexSchedules.length
        );
        const courseIndexSchedule = courseIndexSchedules[randomIndex];
        child.courses[course.course] = {
          index: courseIndexSchedule.index,
          timeslots: courseIndexSchedule.timeslots,
        };
      } else {
        const randomParent = parents[Math.floor(rng.quick() * parents.length)];
        const parentCourse = randomParent.courses[course.course];
        // Inherit from parent
        child.courses[course.course] = {
          index: parentCourse.index,
          timeslots: parentCourse.timeslots,
        };
      }
    }
    children.push(child);
  }
  return children;
}

const MAX_EVOLUTIONS = 10;
for (let i = 0; i < MAX_EVOLUTIONS; i++) {
  currentGenTimetables = nextEvolution(currentGenTimetables, {
    mutationProbability: 0.1,
    numberOfTimetables: 200,
  });
  const analysis = analyzeTimetables(currentGenTimetables);
  console.log(`Evolution ${i}`);
  console.log(analysis);
  printTimetable(analysis.bestTimetable, { precision: "30m" });
}

// console.log(
//   evaluateTimetable({
//     courses: {
//       SC2001: {
//         index: "1",
//         timeslots: [
//           {
//             day: "MON",
//             from: { hour: 10, minute: 0 },
//             to: { hour: 11, minute: 0 },
//             type: "LEC",
//           },
//         ],
//       },
//       SC2005: {
//         index: "1",
//         timeslots: [
//           {
//             day: "MON",
//             from: { hour: 11, minute: 0 },
//             to: { hour: 14, minute: 0 },
//             type: "LEC",
//           },
//         ],
//       },
//     },
//   })
// );

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
