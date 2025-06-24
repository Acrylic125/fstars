import fs from "fs";
import path from "path";
import { Class, CourseListSchema, Day, Days, Time, TypeSchema } from "./schema";
import seedrandom from "seedrandom";
import { Timeslot } from "./utils";
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
      return toMinutes(a.from) - toMinutes(b.from);
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
        toMinutes(lastTimeSlot.to) > toMinutes(timeslot.from)
      ) {
        return -1;
      }

      if (lastTimeSlot) {
        // Check if this timeslot is consecutive with the last one
        // Consider slots consecutive if gap is <= 30 mins
        const gap = toMinutes(timeslot.from) - toMinutes(lastTimeSlot.to);
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
