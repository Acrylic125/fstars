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

// Get the best timetable
const timetable = planTimetable(results, [
  "SC2001",
  "SC2005",
  "SC2203",
  "SC2006",
  "SC2008",
]);

const slots = getSlotsForPlan(results, timetable);
const analysis = analyzeTimetable(slots);

console.log("Optimal Timetable:");
console.log(timetable);
console.log("\nTimetable Analysis:");
console.log(`Score: ${analysis.score}`);
console.log(`Days with classes: ${analysis.analysis.daysWithClasses}`);
console.log(
  `Average gap between classes: ${Math.round((analysis.analysis.averageGaps / 60) * 10) / 10} hours`
);
console.log(`Long blocks (>4h): ${analysis.analysis.longBlocks}`);
console.log(`Days starting before 10:30: ${analysis.analysis.earlyStarts}`);
console.log(`Days ending after 17:30: ${analysis.analysis.lateEnds}`);

displayTimetable(slots);

// Show alternative indices for each course
showAlternativeIndices(results, [
  "SC2001",
  "SC2005",
  "SC2203",
  "SC2006",
  "SC2008",
]);

// Show index swap analysis for each course
console.log("\n" + "=".repeat(80));
console.log(
  "INDEX SWAP ANALYSIS - How changing each course affects the timetable"
);
console.log("=".repeat(80));

for (const courseCode of ["SC2001", "SC2005", "SC2203", "SC2006", "SC2008"]) {
  showIndexSwapAnalysis(results, timetable, courseCode);
}

// Uncomment the following lines to see multiple ranked timetables
/*
console.log("\n" + "=".repeat(50));
console.log("TOP 3 TIMETABLES:");
console.log("=".repeat(50));

const multipleTimetables = planMultipleTimetables(results, [
  "SC2001",
  "SC2005", 
  "SC2203",
  "SC2006",
  "SC2008",
], 3);

multipleTimetables.forEach((result, index) => {
  console.log(`\nRank ${index + 1} (Score: ${result.score}):`);
  console.log(result.plan);
  
  const resultSlots = getSlotsForPlan(results, result.plan);
  const resultAnalysis = analyzeTimetable(resultSlots);
  console.log(`Days with classes: ${resultAnalysis.analysis.daysWithClasses}`);
  console.log(`Average gap: ${Math.round(resultAnalysis.analysis.averageGaps / 60 * 10) / 10}h`);
  console.log(`Long blocks: ${resultAnalysis.analysis.longBlocks}`);
});
*/

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

  for (const [day, daySlots] of dayMap.entries()) {
    daySlots.sort((a, b) => a.from - b.from);

    const dayStart = 10 * 60 + 30; // 10:30
    const dayEnd = 17 * 60 + 30; // 17:30

    // Score for day start time (prefer starting at or after 10:30)
    if (daySlots.length > 0) {
      const firstClassStart = daySlots[0].from;
      if (firstClassStart >= dayStart) {
        score += 3; // Good start time
      } else if (firstClassStart >= 9 * 60) {
        // 9:00
        score += 1; // Acceptable but not ideal
      } else {
        score -= 2; // Too early
      }
    }

    // Score for day end time (prefer ending at or before 17:30)
    if (daySlots.length > 0) {
      const lastClassEnd = daySlots[daySlots.length - 1].to;
      if (lastClassEnd <= dayEnd) {
        score += 3; // Good end time
      } else if (lastClassEnd <= 18 * 60) {
        // 18:00
        score += 1; // Acceptable but not ideal
      } else {
        score -= 2; // Too late
      }
    }

    // Score for gaps between classes and block lengths
    if (daySlots.length > 1) {
      let blockStart = daySlots[0].from;
      let currentBlockLength = daySlots[0].to - daySlots[0].from;

      for (let i = 1; i < daySlots.length; i++) {
        const prev = daySlots[i - 1];
        const curr = daySlots[i];
        const gap = curr.from - prev.to;

        // Score gaps between classes
        if (gap <= 60) {
          score += 4; // Ideal 1-hour break
        } else if (gap <= 90) {
          score += 2; // Good break (1-1.5 hours)
        } else if (gap <= 120) {
          score += 1; // Acceptable break (1.5-2 hours)
        } else {
          score -= 3; // Bad gap (>2 hours)
        }

        // Check if we're still in the same block
        if (gap <= 120) {
          // Still in same block, update block length
          currentBlockLength = curr.to - blockStart;
        } else {
          // New block starts
          blockStart = curr.from;
          currentBlockLength = curr.to - curr.from;
        }

        // Score block length (prefer blocks <= 4 hours)
        if (currentBlockLength > 4 * 60) {
          // 4 hours
          score -= 5; // Too long block
        } else if (currentBlockLength > 3 * 60) {
          // 3 hours
          score -= 1; // Long but acceptable
        }
      }
    }

    // Bonus for compact schedules (fewer days with classes)
    if (daySlots.length > 0) {
      score += 1; // Small bonus for each day with classes
    }
  }

  // Penalty for too many days with classes (prefer compact schedule)
  const daysWithClasses = dayMap.size;
  if (daysWithClasses > 5) {
    score -= (daysWithClasses - 5) * 2; // Penalty for spreading across too many days
  }

  return score;
}

function analyzeTimetable(slots: TimetableSlot[]): {
  score: number;
  analysis: {
    daysWithClasses: number;
    averageGaps: number;
    longBlocks: number;
    earlyStarts: number;
    lateEnds: number;
  };
} {
  const dayMap = new Map<Day, TimetableSlot[]>();
  for (const slot of slots) {
    if (!dayMap.has(slot.day)) dayMap.set(slot.day, []);
    dayMap.get(slot.day)!.push(slot);
  }

  let totalGaps = 0;
  let gapCount = 0;
  let longBlocks = 0;
  let earlyStarts = 0;
  let lateEnds = 0;

  for (const [, daySlots] of dayMap.entries()) {
    daySlots.sort((a, b) => a.from - b.from);

    const dayStart = 10 * 60 + 30; // 10:30
    const dayEnd = 17 * 60 + 30; // 17:30

    if (daySlots.length > 0) {
      // Check start time
      if (daySlots[0].from < dayStart) earlyStarts++;

      // Check end time
      if (daySlots[daySlots.length - 1].to > dayEnd) lateEnds++;

      // Analyze gaps and blocks
      if (daySlots.length > 1) {
        let blockStart = daySlots[0].from;
        let currentBlockLength = daySlots[0].to - daySlots[0].from;

        for (let i = 1; i < daySlots.length; i++) {
          const prev = daySlots[i - 1];
          const curr = daySlots[i];
          const gap = curr.from - prev.to;

          totalGaps += gap;
          gapCount++;

          if (gap <= 120) {
            currentBlockLength = curr.to - blockStart;
          } else {
            blockStart = curr.from;
            currentBlockLength = curr.to - curr.from;
          }

          if (currentBlockLength > 4 * 60) longBlocks++;
        }
      }
    }
  }

  const averageGaps = gapCount > 0 ? totalGaps / gapCount : 0;

  return {
    score: evaluateTimetable(slots),
    analysis: {
      daysWithClasses: dayMap.size,
      averageGaps: Math.round(averageGaps),
      longBlocks,
      earlyStarts,
      lateEnds,
    },
  };
}

function getSlotsForPlan(
  allCourses: Course[],
  plan: { course: string; index: string }[]
): TimetableSlot[] {
  const slots: TimetableSlot[] = [];

  for (const { course: courseCode, index: indexCode } of plan) {
    const course = allCourses.find((c) => c.course === courseCode);
    if (!course) continue;

    const index = course.indices.find((i) => i.index === indexCode);
    if (!index) continue;

    slots.push(...getSlots(index.classes));
  }

  return slots;
}

function displayTimetable(slots: TimetableSlot[]): void {
  const dayMap = new Map<Day, TimetableSlot[]>();
  for (const slot of slots) {
    if (!dayMap.has(slot.day)) dayMap.set(slot.day, []);
    dayMap.get(slot.day)!.push(slot);
  }

  const dayOrder: Day[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  console.log("\nDetailed Schedule:");
  console.log("==================");

  for (const day of dayOrder) {
    const daySlots = dayMap.get(day);
    if (!daySlots || daySlots.length === 0) continue;

    daySlots.sort((a, b) => a.from - b.from);

    console.log(`\n${day}:`);
    for (const slot of daySlots) {
      const startTime = `${Math.floor(slot.from / 60)
        .toString()
        .padStart(2, "0")}:${(slot.from % 60).toString().padStart(2, "0")}`;
      const endTime = `${Math.floor(slot.to / 60)
        .toString()
        .padStart(2, "0")}:${(slot.to % 60).toString().padStart(2, "0")}`;
      console.log(`  ${startTime} - ${endTime}`);
    }
  }
}

function planMultipleTimetables(
  allCourses: Course[],
  timetableCourses: string[],
  maxResults: number = 5
): Array<{ plan: { course: string; index: string }[]; score: number }> {
  const coursesToPlan = allCourses.filter((course) =>
    timetableCourses.includes(course.course)
  );

  const results: Array<{
    plan: { course: string; index: string }[];
    score: number;
  }> = [];

  function recurse(
    i: number,
    currentPlan: { course: string; index: string }[],
    currentSlots: TimetableSlot[]
  ) {
    if (i === coursesToPlan.length) {
      const score = evaluateTimetable(currentSlots);
      results.push({ plan: [...currentPlan], score });

      // Keep only the top results
      results.sort((a, b) => b.score - a.score);
      if (results.length > maxResults) {
        results.splice(maxResults);
      }
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

  if (results.length === 0) throw new Error("No valid timetable found");
  return results;
}

function findValidIndicesForCourse(
  allCourses: Course[],
  targetCourse: string,
  otherCourses: string[]
): Array<{ index: string; score: number; conflicts: string[] }> {
  const targetCourseData = allCourses.find((c) => c.course === targetCourse);
  if (!targetCourseData) return [];

  // Get all slots from other courses
  const otherSlots: TimetableSlot[] = [];
  for (const courseCode of otherCourses) {
    const course = allCourses.find((c) => c.course === courseCode);
    if (!course) continue;

    // For each index of this course, add its slots
    for (const index of course.indices) {
      otherSlots.push(...getSlots(index.classes));
    }
  }

  const validIndices: Array<{
    index: string;
    score: number;
    conflicts: string[];
  }> = [];

  // Test each index of the target course
  for (const index of targetCourseData.indices) {
    const indexSlots = getSlots(index.classes);

    // Check for conflicts with other courses
    const conflicts: string[] = [];
    let hasConflict = false;

    for (const slot of indexSlots) {
      for (const otherSlot of otherSlots) {
        if (
          slot.day === otherSlot.day &&
          !(slot.to <= otherSlot.from || slot.from >= otherSlot.to)
        ) {
          hasConflict = true;
          // Find which course this conflict is with
          for (const courseCode of otherCourses) {
            const course = allCourses.find((c) => c.course === courseCode);
            if (!course) continue;

            for (const courseIndex of course.indices) {
              const courseSlots = getSlots(courseIndex.classes);
              if (
                courseSlots.some(
                  (s) =>
                    s.day === otherSlot.day &&
                    s.from === otherSlot.from &&
                    s.to === otherSlot.to
                )
              ) {
                conflicts.push(`${courseCode} (Index ${courseIndex.index})`);
                break;
              }
            }
          }
        }
      }
    }

    if (!hasConflict) {
      // Calculate score for this index
      const score = evaluateTimetable(indexSlots);
      validIndices.push({ index: index.index, score, conflicts: [] });
    } else {
      // Still include conflicting indices but mark them
      validIndices.push({ index: index.index, score: -1, conflicts });
    }
  }

  // Sort by score (valid indices first, then by score)
  validIndices.sort((a, b) => {
    if (a.conflicts.length === 0 && b.conflicts.length > 0) return -1;
    if (a.conflicts.length > 0 && b.conflicts.length === 0) return 1;
    return b.score - a.score;
  });

  return validIndices;
}

function showAlternativeIndices(
  allCourses: Course[],
  timetableCourses: string[]
): void {
  console.log("\n" + "=".repeat(60));
  console.log("ALTERNATIVE INDICES FOR EACH COURSE");
  console.log("=".repeat(60));

  for (const courseCode of timetableCourses) {
    const otherCourses = timetableCourses.filter((c) => c !== courseCode);
    const validIndices = findValidIndicesForCourse(
      allCourses,
      courseCode,
      otherCourses
    );

    console.log(`\n${courseCode}:`);
    console.log("-".repeat(40));

    if (validIndices.length === 0) {
      console.log("  No indices available");
      continue;
    }

    // Group by validity
    const validOptions = validIndices.filter((v) => v.conflicts.length === 0);
    const conflictingOptions = validIndices.filter(
      (v) => v.conflicts.length > 0
    );

    if (validOptions.length > 0) {
      console.log("  ✅ VALID INDICES (no conflicts):");
      validOptions.forEach((option, i) => {
        console.log(
          `    ${i + 1}. Index ${option.index} (Score: ${option.score})`
        );
      });
    }

    if (conflictingOptions.length > 0) {
      console.log("  ❌ CONFLICTING INDICES:");
      conflictingOptions.forEach((option, i) => {
        console.log(`    ${i + 1}. Index ${option.index}`);
        console.log(`       Conflicts with: ${option.conflicts.join(", ")}`);
      });
    }

    // Show detailed schedule for the best valid index
    if (validOptions.length > 0) {
      const bestIndex = validOptions[0];
      const course = allCourses.find((c) => c.course === courseCode);
      const index = course?.indices.find((i) => i.index === bestIndex.index);

      if (index) {
        console.log(`\n  📅 Best schedule for Index ${bestIndex.index}:`);
        const slots = getSlots(index.classes);
        const dayMap = new Map<Day, TimetableSlot[]>();

        for (const slot of slots) {
          if (!dayMap.has(slot.day)) dayMap.set(slot.day, []);
          dayMap.get(slot.day)!.push(slot);
        }

        const dayOrder: Day[] = [
          "MON",
          "TUE",
          "WED",
          "THU",
          "FRI",
          "SAT",
          "SUN",
        ];
        for (const day of dayOrder) {
          const daySlots = dayMap.get(day);
          if (!daySlots || daySlots.length === 0) continue;

          daySlots.sort((a, b) => a.from - b.from);
          console.log(
            `    ${day}: ${daySlots
              .map((slot) => {
                const start = `${Math.floor(slot.from / 60)
                  .toString()
                  .padStart(
                    2,
                    "0"
                  )}:${(slot.from % 60).toString().padStart(2, "0")}`;
                const end = `${Math.floor(slot.to / 60)
                  .toString()
                  .padStart(
                    2,
                    "0"
                  )}:${(slot.to % 60).toString().padStart(2, "0")}`;
                return `${start}-${end}`;
              })
              .join(", ")}`
          );
        }
      }
    }
  }
}

function showIndexSwapAnalysis(
  allCourses: Course[],
  basePlan: { course: string; index: string }[],
  targetCourse: string
): void {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`INDEX SWAP ANALYSIS FOR ${targetCourse}`);
  console.log(`${"=".repeat(60)}`);

  const targetCourseData = allCourses.find((c) => c.course === targetCourse);
  if (!targetCourseData) {
    console.log(`Course ${targetCourse} not found`);
    return;
  }

  // Get the current index for the target course
  const currentIndex = basePlan.find((p) => p.course === targetCourse)?.index;
  if (!currentIndex) {
    console.log(`Current index for ${targetCourse} not found in plan`);
    return;
  }

  // Get slots for all other courses (excluding target course)
  const otherSlots: TimetableSlot[] = [];
  for (const { course: courseCode, index: indexCode } of basePlan) {
    if (courseCode === targetCourse) continue;

    const course = allCourses.find((c) => c.course === courseCode);
    if (!course) continue;

    const index = course.indices.find((i) => i.index === indexCode);
    if (!index) continue;

    otherSlots.push(...getSlots(index.classes));
  }

  console.log(`Current index: ${currentIndex}`);
  console.log(
    `Other courses in plan: ${basePlan
      .filter((p) => p.course !== targetCourse)
      .map((p) => `${p.course} (${p.index})`)
      .join(", ")}`
  );
  console.log();

  const analysis: Array<{
    index: string;
    score: number;
    conflicts: string[];
    improvement: number;
  }> = [];

  // Test each index of the target course
  for (const index of targetCourseData.indices) {
    const indexSlots = getSlots(index.classes);

    // Check for conflicts
    const conflicts: string[] = [];
    let hasConflict = false;

    for (const slot of indexSlots) {
      for (const otherSlot of otherSlots) {
        if (
          slot.day === otherSlot.day &&
          !(slot.to <= otherSlot.from || slot.from >= otherSlot.to)
        ) {
          hasConflict = true;
          conflicts.push(
            `${otherSlot.day} ${Math.floor(otherSlot.from / 60)}:${(otherSlot.from % 60).toString().padStart(2, "0")}`
          );
        }
      }
    }

    if (!hasConflict) {
      // Calculate score for this combination
      const combinedSlots = [...otherSlots, ...indexSlots];
      const score = evaluateTimetable(combinedSlots);

      // Calculate current score for comparison
      const currentSlots = getSlotsForPlan(allCourses, basePlan);
      const currentScore = evaluateTimetable(currentSlots);

      const improvement = score - currentScore;

      analysis.push({
        index: index.index,
        score,
        conflicts: [],
        improvement,
      });
    } else {
      analysis.push({
        index: index.index,
        score: -1,
        conflicts,
        improvement: -999,
      });
    }
  }

  // Sort by improvement (best first)
  analysis.sort((a, b) => b.improvement - a.improvement);

  console.log("Index Options (sorted by improvement):");
  console.log("-".repeat(50));

  analysis.forEach((option, i) => {
    const status = option.conflicts.length === 0 ? "✅" : "❌";
    const improvementText =
      option.improvement > 0
        ? `+${option.improvement}`
        : option.improvement.toString();
    const currentMarker = option.index === currentIndex ? " (CURRENT)" : "";

    console.log(`${i + 1}. ${status} Index ${option.index}${currentMarker}`);
    console.log(`   Score: ${option.score} (Improvement: ${improvementText})`);

    if (option.conflicts.length > 0) {
      console.log(`   Conflicts: ${option.conflicts.join(", ")}`);
    } else {
      // Show schedule for this index
      const index = targetCourseData.indices.find(
        (i) => i.index === option.index
      );
      if (index) {
        const slots = getSlots(index.classes);
        const dayMap = new Map<Day, TimetableSlot[]>();

        for (const slot of slots) {
          if (!dayMap.has(slot.day)) dayMap.set(slot.day, []);
          dayMap.get(slot.day)!.push(slot);
        }

        const schedule = [];
        const dayOrder: Day[] = [
          "MON",
          "TUE",
          "WED",
          "THU",
          "FRI",
          "SAT",
          "SUN",
        ];
        for (const day of dayOrder) {
          const daySlots = dayMap.get(day);
          if (daySlots && daySlots.length > 0) {
            daySlots.sort((a, b) => a.from - b.from);
            const times = daySlots.map((slot) => {
              const start = `${Math.floor(slot.from / 60)
                .toString()
                .padStart(
                  2,
                  "0"
                )}:${(slot.from % 60).toString().padStart(2, "0")}`;
              const end = `${Math.floor(slot.to / 60)
                .toString()
                .padStart(
                  2,
                  "0"
                )}:${(slot.to % 60).toString().padStart(2, "0")}`;
              return `${start}-${end}`;
            });
            schedule.push(`${day}: ${times.join(", ")}`);
          }
        }
        console.log(`   Schedule: ${schedule.join(" | ")}`);
      }
    }
    console.log();
  });
}
