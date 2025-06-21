import fs from "fs";
import path from "path";
import {
  Class,
  Course,
  CourseListSchema,
  CourseSchema,
  Day,
  Time,
} from "./schema";
import { z } from "zod";

const resultsPath = path.resolve(__dirname, "results.json");
const results = CourseListSchema.parse(
  JSON.parse(fs.readFileSync(resultsPath, "utf8"))
);

const timetable = planTimetable(results, [
  "SC2001",
  "SC2005",
  "SC2203",
  "SC2006",
  "SC2008",
]);

console.log(timetable);

type TimetableSlot = {
  day: Day;
  from: number; // in minutes
  to: number; // in minutes
};

function timeToMinutes(time: Time): number {
  return time.hour * 60 + time.minute;
}

function classToSlot(cls: Class): TimetableSlot {
  return {
    day: cls.day,
    from: timeToMinutes(cls.timeFrom),
    to: timeToMinutes(cls.timeTo),
  };
}

function hasConflict(slots: TimetableSlot[], newSlot: TimetableSlot): boolean {
  return slots.some(
    (slot) =>
      slot.day === newSlot.day &&
      !(newSlot.to <= slot.from || newSlot.from >= slot.to)
  );
}

function getSlots(classes: Class[]): TimetableSlot[] {
  const seen = new Set<string>();
  return classes
    .filter((cls) => {
      const key = `${cls.day}-${cls.timeFrom.hour}:${cls.timeFrom.minute}-${cls.timeTo.hour}:${cls.timeTo.minute}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(classToSlot);
}

function planTimetable(
  allCourses: Course[],
  timetableCourses: string[]
): { course: string; index: string }[] {
  const coursesToPlan = allCourses.filter((course) =>
    timetableCourses.includes(course.course)
  );

  let best: {
    plan: { course: string; index: string }[];
    score: number;
  } | null = null;

  function recurse(
    i: number,
    currentPlan: { course: string; index: string }[],
    currentSlots: TimetableSlot[]
  ) {
    if (i === coursesToPlan.length) {
      const score = evaluateTimetable(currentSlots);
      if (!best || score > best.score) best = { plan: [...currentPlan], score };
      return;
    }

    const course = coursesToPlan[i];
    for (const index of course.indices) {
      const slots = getSlots(index.classes);
      if (slots.some((slot) => hasConflict(currentSlots, slot))) continue;

      recurse(
        i + 1,
        [...currentPlan, { course: course.course, index: index.index }],
        [...currentSlots, ...slots]
      );
    }
  }

  recurse(0, [], []);

  if (!best) throw new Error("No valid timetable found");
  return best.plan;
}

function evaluateTimetable(slots: TimetableSlot[]): number {
  const dayMap = new Map<Day, TimetableSlot[]>();
  for (const slot of slots) {
    if (!dayMap.has(slot.day)) dayMap.set(slot.day, []);
    dayMap.get(slot.day)!.push(slot);
  }

  let score = 0;

  for (const [, slots] of dayMap.entries()) {
    slots.sort((a, b) => a.from - b.from);

    const dayStart = 10 * 60 + 30;
    const dayEnd = 17 * 60 + 30;

    if (slots[0].from >= dayStart) score += 1;
    if (slots[slots.length - 1].to <= dayEnd) score += 1;

    let blockStart = slots[0].from;
    for (let i = 1; i < slots.length; i++) {
      const prev = slots[i - 1];
      const curr = slots[i];
      const gap = curr.from - prev.to;

      if (gap > 120)
        continue; // bad gap
      else if (gap <= 60)
        score += 2; // ideal 1h break
      else score += 1;

      if (curr.to - blockStart > 240)
        score -= 1; // too long block
      else blockStart = Math.min(curr.from, blockStart);
    }
  }

  return score;
}
