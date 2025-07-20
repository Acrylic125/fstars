import seedrandom from "seedrandom";
import {
  CourseClasses,
  IndexClass,
  toMinutes,
  toMinutesFromTimeAsArray,
} from "./utils";
import {
  CourseCode,
  CourseIndex,
} from "@/components/timetable/timetable-store";
import {
  asPriorityNumber,
  TimetableGenerator,
} from "@/components/timetable/timetable-generator-store";
import { Config } from "@/lib/config";

const rng = seedrandom("abcdefghijklmnopqrstuvwxyz");

// export function generateTimetable(
//   courses: Course[],
//   options: {
//     numberOfTimetables: number;
//   }
// ) {}

export type GeneratedTimetable = {
  courseIndexSelection: Record<CourseCode, CourseIndex>;
};

type IndexClassWithCourseAndIndex = IndexClass & {
  courseCode: CourseCode;
  index: CourseIndex;
};

function priorityScore(priority: number) {
  switch (priority) {
    case asPriorityNumber("Important"):
      return 64;
    case asPriorityNumber("Preferred"):
      return 16;
    case asPriorityNumber("Not Preferred"):
      return -16;
    default:
      return 0;
  }
}

function toMap(record: Record<CourseCode, CourseClasses>) {
  return new Map(Object.entries(record));
}

export class GeneticGenerator {
  constructor(
    private readonly courses: Map<CourseCode, CourseClasses>,
    private readonly factors: TimetableGenerator["factors"],
    private readonly options: {
      iterations: number;
      generatePerIteration: number;
      mutationProbability: number;
      minsConstituteAsConsecutive: number;
      isSkewedThresholdSD: number;
    } = {
      iterations: 100,
      generatePerIteration: 100,
      mutationProbability: 0.2,
      minsConstituteAsConsecutive: 10,
      isSkewedThresholdSD: 3,
    }
  ) {}

  private evaluateTimetable(timetable: GeneratedTimetable) {
    // Before we start, we will define some fallback scores
    // in the event that the factor is not appropriate for consideration.
    // i.e. Days without classes.
    const defaultConsecutiveScore = Math.max(
      priorityScore(this.factors.consecutiveClasses.before1h.priority),
      priorityScore(this.factors.consecutiveClasses.between1hAnd2h.priority),
      priorityScore(this.factors.consecutiveClasses.between2hAnd3h.priority),
      priorityScore(this.factors.consecutiveClasses.between3hAnd4h.priority),
      priorityScore(this.factors.consecutiveClasses.after4h.priority)
    );
    const defaultGapScore = Math.max(
      priorityScore(this.factors.gapsBetweenClasses.before1h.priority),
      priorityScore(this.factors.gapsBetweenClasses.between1hAnd2h.priority),
      priorityScore(this.factors.gapsBetweenClasses.between2hAnd3h.priority),
      priorityScore(this.factors.gapsBetweenClasses.between3hAnd4h.priority),
      priorityScore(this.factors.gapsBetweenClasses.after4h.priority)
    );
    const defaultStartAfterScore = priorityScore(
      this.factors.startAfterAndEndBefore.startAfter.priority
    );
    const defaultEndBeforeScore = priorityScore(
      this.factors.startAfterAndEndBefore.endBefore.priority
    );

    const daysInAWeek = 7;

    // This is our evaluation score. We will use it to determine the fitness of the timetable
    // based on the factors.
    //
    // Generally, scores are added on a PER DAY basis, for every day in the week.
    // Factors that aren't directly measured on a per day basis are multiplied by the number of days in a week.
    let score = 0;

    // The score will be aggregated over all weeks.
    for (let week = 1; week <= Config.lastWeek; week++) {
      // First, we need to map the timeslots to the day.
      const weekClasses = new Array<IndexClassWithCourseAndIndex[]>(
        daysInAWeek
      ).fill([]);
      for (const [courseCode, selectedIndex] of Object.entries(
        timetable.courseIndexSelection
      )) {
        const course = this.courses.get(courseCode);
        if (!course) {
          continue;
        }
        for (const indexClass of course.indexes) {
          for (const cls of indexClass.classes) {
            if (cls.weeks.includes(week)) {
              weekClasses[cls.day].push({
                ...cls,
                courseCode,
                index: selectedIndex,
              });
            }
          }
        }
      }

      // Next, we will sort the weekClasses by start time such that the first class is the earliest.
      // THis makes it a lot easier to compute consecutive classes, gaps, and collisions.
      //
      // Additionally, we can deduce the following:
      // - Whether the day is free
      // - Whether the week is skewed. i.e. Mean and standard deviation of the class times
      // - The start and end times of each day.
      let totalMinutes = 0;
      let daysWithClasses = 0;
      const weekTimes = new Array<number>(daysInAWeek).fill(0);

      for (let day = 0; day < daysInAWeek; day++) {
        const dayClasses = weekClasses[day];
        // Since we have this info, we can also deduce whether the day is free.
        const isDayFree = dayClasses.length === 0;
        if (!isDayFree) {
          daysWithClasses++;

          dayClasses.sort((a, b) => {
            return (
              toMinutesFromTimeAsArray(a.startTime) -
              toMinutesFromTimeAsArray(b.startTime)
            );
          });

          const firstClassStartTime = toMinutesFromTimeAsArray(
            dayClasses[0].startTime
          );
          const lastClassEndTime = toMinutesFromTimeAsArray(
            dayClasses[dayClasses.length - 1].endTime
          );

          const dayMinutes = lastClassEndTime - firstClassStartTime;
          totalMinutes += dayMinutes;
          weekTimes[day] = dayMinutes;

          if (
            firstClassStartTime <
            toMinutes(this.factors.startAfterAndEndBefore.startAfter)
          ) {
            score += defaultStartAfterScore;
          }
          if (
            lastClassEndTime >
            toMinutes(this.factors.startAfterAndEndBefore.endBefore)
          ) {
            score += defaultEndBeforeScore;
          }
        } else {
          // Factor in no class days.
          if (this.factors.noClassDays.priority !== asPriorityNumber("None")) {
            score += priorityScore(this.factors.noClassDays.priority);
          }
          // Factor in start after and end before.
          score += defaultStartAfterScore;
          score += defaultEndBeforeScore;
        }
      }

      // Factor in distirbution.
      const meanMinutes =
        daysWithClasses > 0 ? totalMinutes / daysWithClasses : 0;
      const sd =
        daysWithClasses > 0
          ? Math.sqrt(
              weekTimes.reduce((acc, dayMinutes) => {
                return acc + Math.pow(dayMinutes - meanMinutes, 2);
              }, 0) / daysWithClasses
            )
          : 0;
      if (
        this.factors.classDistribution.priority !== asPriorityNumber("None")
      ) {
        if (sd > this.options.isSkewedThresholdSD) {
          if (this.factors.classDistribution.distribution === "Skewed") {
            score +=
              priorityScore(this.factors.classDistribution.priority) *
              daysInAWeek;
          }
        } else {
          if (this.factors.classDistribution.distribution === "Even") {
            score +=
              priorityScore(this.factors.classDistribution.priority) *
              daysInAWeek;
          }
        }
      }

      // Now, we will compute the score for each day of the week.
      for (const dayClasses of weekClasses) {
        let lastTimeSlot: IndexClassWithCourseAndIndex | null = null;
        let curConsecutiveTimeInMin = 0;

        let consecutiveClassBlocks: number[] = [];
        let gapBlocks: number[] = [];

        for (const cls of dayClasses) {
          const startTimeInMin = toMinutesFromTimeAsArray(cls.startTime);
          const endTimeInMin = toMinutesFromTimeAsArray(cls.endTime);
          const time = endTimeInMin - startTimeInMin;

          if (lastTimeSlot) {
            const lastEndTimeInMin = toMinutesFromTimeAsArray(
              lastTimeSlot.endTime
            );
            if (
              // The previous class must end before the current class starts.
              // If not, the timetable has a collision.
              lastEndTimeInMin > startTimeInMin
            ) {
              return -1;
            }

            const gapBetweenClasses = startTimeInMin - lastEndTimeInMin;
            // Check if it should be considered a consecutive class block.
            if (gapBetweenClasses <= this.options.minsConstituteAsConsecutive) {
              curConsecutiveTimeInMin += time;
            } else {
              consecutiveClassBlocks.push(curConsecutiveTimeInMin);
              gapBlocks.push(gapBetweenClasses);
              curConsecutiveTimeInMin = time;
            }
          }

          lastTimeSlot = cls;
        }
        // The last block is not added to the consecutiveClassBlocks array.
        // We will add it now.
        if (curConsecutiveTimeInMin > 0) {
          consecutiveClassBlocks.push(curConsecutiveTimeInMin);
        }

        if (consecutiveClassBlocks.length === 0) {
          // If there are no classes for the day, we will use the fallback scores.
          score += defaultConsecutiveScore;
          score += defaultGapScore;
          continue;
        }

        // Factor in consecutive classes.
        // Here, we will compute the weighted score for the consecutive classes,
        // relative to the total consecutive blocks for the day.
        const sumConsecutiveClassBlocks = consecutiveClassBlocks.reduce(
          (acc, block) => acc + block,
          0
        );
        const consecutiveScore = consecutiveClassBlocks.reduce((acc, block) => {
          let score = 0;
          if (block < 60) {
            score = priorityScore(
              this.factors.consecutiveClasses.before1h.priority
            );
          } else if (block < 120) {
            score = priorityScore(
              this.factors.consecutiveClasses.between1hAnd2h.priority
            );
          } else if (block < 180) {
            score = priorityScore(
              this.factors.consecutiveClasses.between2hAnd3h.priority
            );
          } else if (block < 240) {
            score = priorityScore(
              this.factors.consecutiveClasses.between3hAnd4h.priority
            );
          } else {
            score = priorityScore(
              this.factors.consecutiveClasses.after4h.priority
            );
          }
          return acc + score * (block / sumConsecutiveClassBlocks);
        }, 0);

        // Factor in gaps between classes.
        // Here, we will compute the weighted score for the gaps between classes,
        // relative to the total gap blocks for the day.
        const sumGapBlocks = gapBlocks.reduce((acc, block) => acc + block, 0);
        const gapScore = gapBlocks.reduce((acc, block) => {
          let score = 0;
          if (block < 60) {
            score = priorityScore(
              this.factors.gapsBetweenClasses.before1h.priority
            );
          } else if (block < 120) {
            score = priorityScore(
              this.factors.gapsBetweenClasses.between1hAnd2h.priority
            );
          } else if (block < 180) {
            score = priorityScore(
              this.factors.gapsBetweenClasses.between2hAnd3h.priority
            );
          } else if (block < 240) {
            score = priorityScore(
              this.factors.gapsBetweenClasses.between3hAnd4h.priority
            );
          } else {
            score = priorityScore(
              this.factors.gapsBetweenClasses.after4h.priority
            );
          }
          return acc + score * (block / sumGapBlocks);
        }, 0);

        score += consecutiveScore + gapScore;
      }
    }

    return score;
  }

  private nextIteration() {
    return [];
  }
}
