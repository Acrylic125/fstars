import fs from "fs";
import path from "path";
import { Class, CourseListSchema, Day, Days, Time, TypeSchema } from "./schema";
import seedrandom from "seedrandom";
import { binSearch, isMinuteInRange, TimeMinuteRange, Timeslot } from "./utils";
import { z } from "zod";

function toMinutes(time: Time) {
  return time.hour * 60 + time.minute;
}

export function analyzeTimetables(timetables: Timetable[]) {
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

export function printTimetable(
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

export type CourseCode = string;

export type CourseIndexSchedule = {
  course: CourseCode;
  index: string;
  timeslots: Timeslot[];
};

export type Timetable = {
  courses: {
    [courseCode: string]: {
      index: string;
      timeslots: Timeslot[];
    };
  };
};

const ALL_WEEKS = Array.from({ length: 14 }, (_, i) => i + 1);

const scores = {
  veryImportant: 256,
  important: 128,
  niceToHave: 64,
  no: 0,
  absolutelyNot: -10000,
};

export function evaluateTimetable(
  timetable: Timetable,
  scoring: {
    dayLength: {
      score: number;
      range: TimeMinuteRange;
    }[];
    dayStart: {
      score: number;
      range: TimeMinuteRange;
    }[];
    dayEnd: {
      score: number;
      range: TimeMinuteRange;
    }[];
    consecutiveClasses: {
      score: number;
      range: TimeMinuteRange;
    }[];
    gap: {
      score: number;
      range: TimeMinuteRange;
    }[];
    favourIndexes: {
      [courseCode: string]: {
        index: string;
        score: number;
      }[];
    };
  } = {
    dayLength: [
      {
        range: [null, 0],
        score: scores.veryImportant,
      },
      {
        range: [0, 60 * 3],
        score: scores.no,
      },
      {
        range: [60 * 3, null],
        score: scores.niceToHave,
      },
    ],
    dayStart: [
      {
        range: [10 * 60, null],
        score: scores.niceToHave,
      },
    ],
    dayEnd: [
      {
        range: [null, 14 * 60],
        score: scores.niceToHave,
      },
    ],
    consecutiveClasses: [
      {
        range: [0, 60],
        score: scores.no,
      },
      {
        range: [60, 240],
        score: scores.niceToHave,
      },
      {
        range: [240, null],
        score: scores.no,
      },
    ],
    gap: [
      {
        range: [0, 60],
        score: scores.important,
      },
      {
        range: [60, 120],
        score: scores.niceToHave,
      },
      {
        range: [120, 180],
        score: scores.no,
      },
      {
        range: [180, null],
        score: scores.absolutelyNot,
      },
    ],
    favourIndexes: {
      SC2001: [
        {
          index: "10134",
          score: scores.niceToHave,
        },
      ],
      // SC2005: [
      //   {
      //     index: "10183",
      //     score: scores.important,
      //   },
      // ],
      // SC2008: [
      //   {
      //     index: "10226",
      //     score: scores.niceToHave,
      //   },
      //   {
      //     index: "10221",
      //     score: scores.niceToHave,
      //   },
      // ],
      // SC2001: [
      //   {
      //     index: "10127",
      //     score: scores.veryImportant * 10,
      //   },
      // ],
      SC2005: [
        {
          index: "10178",
          score: scores.veryImportant * 10,
        },
      ],
      SC2006: [
        {
          index: "10196",
          score: scores.veryImportant * 10,
        },
      ],
      SC2008: [
        {
          index: "10221",
          score: scores.veryImportant * 10,
        },
      ],
      SC2203: [
        // {
        //   index: "10257",
        //   score: scores.niceToHave,
        // },
        {
          index: "10261",
          score: scores.niceToHave * 10,
        },
      ],
    },
  }
) {
  const temp =
    JSON.stringify(timetable) ===
    `{"courses":{"SC2001":{"index":"10141","timeslots":[{"day":"MON","from":{"hour":12,"minute":30},"to":{"hour":14,"minute":20},"type":"LEC/STUDIO","weeks":[1,2,3,4,5,6,7,8,9,10,11,12,13,14]},{"day":"MON","from":{"hour":16,"minute":30},"to":{"hour":17,"minute":20},"type":"TUT","weeks":[2,3,4,5,6,7,8,9,11,12,13]},{"day":"TUE","from":{"hour":12,"minute":30},"to":{"hour":14,"minute":20},"type":"LAB","weeks":[1,3,5,7,9,11,13]}]},"SC2005":{"index":"10178","timeslots":[{"day":"FRI","from":{"hour":11,"minute":30},"to":{"hour":12,"minute":20},"type":"LEC/STUDIO","weeks":[10]},{"day":"THU","from":{"hour":12,"minute":30},"to":{"hour":13,"minute":20},"type":"LEC/STUDIO","weeks":[1,2,3,4,6,7,8,9,11,12,13]},{"day":"MON","from":{"hour":9,"minute":30},"to":{"hour":10,"minute":20},"type":"TUT","weeks":[10]},{"day":"TUE","from":{"hour":14,"minute":30},"to":{"hour":16,"minute":20},"type":"LAB","weeks":[2,4,6,8,10,12]}]},"SC2006":{"index":"10196","timeslots":[{"day":"MON","from":{"hour":8,"minute":30},"to":{"hour":9,"minute":20},"type":"LEC/STUDIO","weeks":[10]},{"day":"THU","from":{"hour":13,"minute":30},"to":{"hour":14,"minute":20},"type":"LEC/STUDIO","weeks":[1,2,3,4,5,6,7,8,9,11,12,13]},{"day":"FRI","from":{"hour":12,"minute":30},"to":{"hour":13,"minute":20},"type":"TUT","weeks":[2,3,4,5,6,7,8,9,11,12,13]},{"day":"WED","from":{"hour":14,"minute":30},"to":{"hour":16,"minute":20},"type":"LAB","weeks":[1,3,5,7,9,11,13]}]},"SC2008":{"index":"10221","timeslots":[{"day":"TUE","from":{"hour":10,"minute":30},"to":{"hour":12,"minute":20},"type":"LEC/STUDIO","weeks":[1,2,3,4,5,6,7,8,9,11,12,13]},{"day":"TUE","from":{"hour":16,"minute":30},"to":{"hour":17,"minute":20},"type":"TUT","weeks":[10]},{"day":"MON","from":{"hour":14,"minute":30},"to":{"hour":16,"minute":20},"type":"LAB","weeks":[2,4,6,8,10,12]}]},"SC2203":{"index":"10261","timeslots":[{"day":"TUE","from":{"hour":8,"minute":30},"to":{"hour":10,"minute":20},"type":"LEC/STUDIO","weeks":[10]},{"day":"TUE","from":{"hour":13,"minute":30},"to":{"hour":14,"minute":20},"type":"TUT","weeks":[10]}]}}}`;
  let score = 0;
  // if (temp) {
  //   console.log("");
  // }
  for (const week of ALL_WEEKS) {
    // console.log(`Week ${week}`);

    const dayTimeSlotMap = new Map<Day, Timeslot[]>();

    // First, we need to map the timeslots to the day
    for (const [courseCode, course] of Object.entries(timetable.courses)) {
      for (const favourIndex of scoring.favourIndexes[courseCode] ?? []) {
        if (course.index === favourIndex.index) {
          score += favourIndex.score;
          break;
        }
      }
      for (const timeslot of course.timeslots) {
        // Check if timeslot.weeks is sorted in asc.
        // if (timeslot.weeks.length > 0) {
        //   for (let i = 0; i < timeslot.weeks.length - 1; i++) {
        //     if (timeslot.weeks[i] > timeslot.weeks[i + 1]) {
        //       throw new Error(
        //         `Timeslot ${timeslot} has weeks ${timeslot.weeks} which is not sorted in asc. This is not allowed.`
        //       );
        //     }
        //   }
        // }
        if (binSearch(timeslot.weeks, week) === -1) {
          continue;
        }
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
        return toMinutes(a.from) - toMinutes(b.from);
      });
      // if (temp && day === "TUE") {
      //   console.log(sorted);
      // }
      dayTimeSlotMap.set(day, sorted);
    }

    // Next, we check if there are any timeslots that overlap
    for (const dayTimeSlot of dayTimeSlotMap.values()) {
      let lastTimeSlot: Timeslot | null = null;
      let curConsecutiveTimeInSeconds = 0;
      let consecutiveStart = false;

      for (const timeslot of dayTimeSlot) {
        if (
          lastTimeSlot &&
          toMinutes(lastTimeSlot.to) > toMinutes(timeslot.from)
        ) {
          return -1;
        }

        if (lastTimeSlot) {
          // Check if this timeslot is consecutive with the last one
          // Consider slots consecutive if gap is <= 30 mins
          const gap = toMinutes(timeslot.from) - toMinutes(lastTimeSlot.to);

          for (const gapScore of scoring.gap) {
            if (isMinuteInRange(gap, gapScore.range)) {
              score += gapScore.score;
              break;
            }
          }

          if (gap <= 30) {
            if (!consecutiveStart) {
              consecutiveStart = true;
              curConsecutiveTimeInSeconds =
                toMinutes(lastTimeSlot.to) - toMinutes(lastTimeSlot.from);
            }
            curConsecutiveTimeInSeconds +=
              toMinutes(timeslot.to) - toMinutes(timeslot.from);
          } else {
            // Gap too large, check previous consecutive block if any
            if (consecutiveStart) {
              for (const consecutiveClassesScore of scoring.consecutiveClasses) {
                if (
                  isMinuteInRange(
                    curConsecutiveTimeInSeconds,
                    consecutiveClassesScore.range
                  )
                ) {
                  score += consecutiveClassesScore.score;
                  break;
                }
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
        for (const consecutiveClassesScore of scoring.consecutiveClasses) {
          if (
            isMinuteInRange(
              curConsecutiveTimeInSeconds,
              consecutiveClassesScore.range
            )
          ) {
            score += consecutiveClassesScore.score;
            break;
          }
        }
      }
    }

    // If the day has only 1 class, then fuck that. Its getting a 0.
    // If there are no timeslots for a day, we add 100 to the score
    // If the day starts after 10:00, we add 30 to the score
    // If the day ends before 14:00, we add 60 to the score. Else if before 17:00, we add 30 to the score
    for (const day of Days) {
      const dayTimeSlot = dayTimeSlotMap.get(day);

      let dayLengthInMin = 0;
      let dayStartInMin = 0;
      let dayEndInMin = 0;

      if (dayTimeSlot && dayTimeSlot.length > 0) {
        if (dayTimeSlot.length === 1) {
          continue;
        }

        const firstTimeSlot = dayTimeSlot[0];
        dayStartInMin = toMinutes(firstTimeSlot.from);
        const lastTimeSlot = dayTimeSlot[dayTimeSlot.length - 1];
        dayEndInMin = toMinutes(lastTimeSlot.to);

        dayLengthInMin = dayEndInMin - dayStartInMin;
      }

      for (const dayLengthScore of scoring.dayLength) {
        if (isMinuteInRange(dayLengthInMin, dayLengthScore.range)) {
          score += dayLengthScore.score;
          break;
        }
      }

      for (const dayStartScore of scoring.dayStart) {
        if (isMinuteInRange(dayStartInMin, dayStartScore.range)) {
          score += dayStartScore.score;
          break;
        }
      }

      for (const dayEndScore of scoring.dayEnd) {
        if (isMinuteInRange(dayEndInMin, dayEndScore.range)) {
          score += dayEndScore.score;
          break;
        }
      }
    }
  }

  return score;
}

// Set random seed
const rng = seedrandom("abcdefghijklmnopqrstuvwxyz");

export function nextEvolution(
  timetables: Timetable[],
  options: {
    courses: Map<CourseCode, CourseIndexSchedule[]>;
    mutationProbability: number;
    numberOfTimetables: number;
  }
): Timetable[] {
  const scores = timetables.map((timetable) => evaluateTimetable(timetable));
  let rankedTimetables = timetables.sort((a, b) => {
    return scores[timetables.indexOf(b)] - scores[timetables.indexOf(a)];
  });
  // Remove duplicates from rankedTimetables
  rankedTimetables = rankedTimetables.filter(
    (timetable, index, self) =>
      index ===
      self.findIndex(
        (t) => JSON.stringify(t.courses) === JSON.stringify(timetable.courses)
      )
  );
  const N = 6;
  const parents = rankedTimetables.slice(0, N);
  const children: Timetable[] = [];
  for (let i = 0; i < options.numberOfTimetables; i++) {
    const child: Timetable = {
      courses: {},
    };
    for (const [
      courseCode,
      courseIndexSchedules,
    ] of options.courses.entries()) {
      if (parents.length <= 0 || rng.quick() < options.mutationProbability) {
        const randomIndex = Math.floor(
          rng.quick() * courseIndexSchedules.length
        );
        const courseIndexSchedule = courseIndexSchedules[randomIndex];
        child.courses[courseCode] = {
          index: courseIndexSchedule.index,
          timeslots: courseIndexSchedule.timeslots,
        };
      } else {
        const randomParent = parents[Math.floor(rng.quick() * parents.length)];
        const parentCourse = randomParent.courses[courseCode];
        // Inherit from parent
        child.courses[courseCode] = {
          index: parentCourse.index,
          timeslots: parentCourse.timeslots,
        };
      }
    }
    children.push(child);
  }
  return children;
}
