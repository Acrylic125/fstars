import seedrandom from "seedrandom";
import {
  CourseClasses,
  IndexClass,
  toMinutes,
  toMinutesFromTimeAsArray,
} from "./utils";
import type {
  CourseCode,
  CourseIndex,
} from "@/components/timetable/timetable-store";
import { Config } from "@/lib/config";
import { type TimetableGenerator } from "@/components/timetable/timetable-generator-store";
import { asPriorityNumber } from "@/components/timetable/utils";

export type GeneratedTimetable = {
  courseIndexSelection: Record<CourseCode, CourseIndex>;
};

export type GeneratedTimetableWithScore = {
  timetable: GeneratedTimetable;
  score: number;
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
      minsConstituteAsConsecutive: number;
      isSkewedThresholdSD: number;
    } = {
      minsConstituteAsConsecutive: 10,
      isSkewedThresholdSD: 3 * 60,
    }
  ) {}

  public evaluateTimetable(timetable: GeneratedTimetable, debug = false) {
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
      );
      for (let day = 0; day < daysInAWeek; day++) {
        weekClasses[day] = [];
      }

      for (const [courseCode, selectedIndex] of Object.entries(
        timetable.courseIndexSelection
      )) {
        const course = this.courses.get(courseCode);
        if (!course) {
          console.log(`Course ${courseCode} not found`);
          continue;
        }
        for (const indexClass of course.indexes) {
          if (indexClass.index !== selectedIndex) {
            continue;
          }
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
      // - The day duration.
      // - Whether the week is skewed. i.e. Mean and standard deviation of the class times.
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

          if (dayMinutes < 120) {
            score += priorityScore(this.factors.dayDuration.below2h.priority);
          } else if (dayMinutes < 240) {
            score += priorityScore(
              this.factors.dayDuration.between2hAnd4h.priority
            );
          } else if (dayMinutes < 360) {
            score += priorityScore(
              this.factors.dayDuration.between4hAnd6h.priority
            );
          } else if (dayMinutes < 480) {
            score += priorityScore(
              this.factors.dayDuration.between6hAnd8h.priority
            );
          } else {
            score += priorityScore(this.factors.dayDuration.above8h.priority);
          }

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
          if (
            this.factors.dayDuration.noClass.priority !==
            asPriorityNumber("None")
          ) {
            score += priorityScore(this.factors.dayDuration.noClass.priority);
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

      if (debug) {
        console.log(
          `Mean minutes: ${meanMinutes}, SD: ${sd}, Days with classes: ${daysWithClasses}`
        );
      }

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
      for (let day = 0; day < daysInAWeek; day++) {
        const dayClasses = weekClasses[day];
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
              //   console.log(
              //     `Collision detected between ${lastTimeSlot.courseCode} ${lastTimeSlot.index} and ${cls.courseCode} ${cls.index}, Week ${week}, Day ${day}, Time ${lastTimeSlot.startTime} - ${lastTimeSlot.endTime} and ${cls.startTime} - ${cls.endTime}`
              //   );
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

  // Lightweight serialization of the timetable.
  // Only used for deduplication.
  private serializeTimetable(timetable: GeneratedTimetable) {
    return Object.entries(timetable.courseIndexSelection)
      .map(([courseCode, index]) => {
        return `${courseCode}:${index}`;
      })
      .join(",");
  }

  private createRandomTimetable(rng: seedrandom.PRNG) {
    const timetable: GeneratedTimetable = {
      courseIndexSelection: {},
    };
    this.courses.forEach((course, courseCode) => {
      if (course.indexes.length <= 0) {
        console.log(`Course ${courseCode} has no indexes!`);
        return;
      }
      const selectedIndex =
        course.indexes[
          Math.min(
            Math.floor(rng.quick() * course.indexes.length),
            course.indexes.length - 1
          )
        ].index;
      timetable.courseIndexSelection[courseCode] = selectedIndex;
    });
    return timetable;
  }

  private createChildTimetable(
    rng: seedrandom.PRNG,
    parents: GeneratedTimetable[],
    mutationProbability: number
  ) {
    if (parents.length === 0) {
      return this.createRandomTimetable(rng);
    }
    const timetable: GeneratedTimetable = {
      courseIndexSelection: {},
    };
    this.courses.forEach((course, courseCode) => {
      if (course.indexes.length <= 0) {
        console.log(`Course ${courseCode} has no indexes!`);
        return;
      }
      if (rng.quick() < mutationProbability) {
        timetable.courseIndexSelection[courseCode] =
          course.indexes[
            Math.min(
              Math.floor(rng.quick() * course.indexes.length),
              course.indexes.length - 1
            )
          ].index;
      } else {
        const selectedIndex =
          parents[
            Math.min(
              Math.floor(rng.quick() * parents.length),
              parents.length - 1
            )
          ].courseIndexSelection[courseCode];
        timetable.courseIndexSelection[courseCode] = selectedIndex;
      }
    });
    return timetable;
  }

  private getTopTimetables(
    timetables: GeneratedTimetable[],
    N: number,
    ignoreCollisions: boolean = false
  ) {
    // Evaluate the timetables.
    let timetablesWithScores = timetables.map((timetable) => {
      return {
        timetable,
        score: this.evaluateTimetable(timetable),
      };
    });
    if (ignoreCollisions) {
      timetablesWithScores = timetablesWithScores.filter((timetable) => {
        return timetable.score !== -1;
      });
    }
    // Sort the iteration timetables by score from highest to lowest.
    timetablesWithScores.sort((a, b) => b.score - a.score);

    // Remove duplicates.
    const alreadyIncluded = new Set<string>();
    const top: GeneratedTimetableWithScore[] = [];
    for (const timetable of timetablesWithScores) {
      const serialized = this.serializeTimetable(timetable.timetable);
      if (!alreadyIncluded.has(serialized)) {
        alreadyIncluded.add(serialized);
        top.push(timetable);
      }
    }

    const results = top.slice(0, N);
    return results;
  }

  private reconcileMissingIndexes(timetable: GeneratedTimetable) {
    // Default to "" if the index is not found.
    for (const courseCode of this.courses.keys()) {
      if (!timetable.courseIndexSelection[courseCode]) {
        timetable.courseIndexSelection[courseCode] = "";
      }
    }
  }

  public generate(
    options: {
      iterations: number;
      generatePerIteration: number;
      mutationProbability: number;
      iterationSelectionAmount: number;
      returnTopN: number;
      seed: string;
      // The variability provides an added level of randomisation, to reduce
      // the likelihood of multiple users generating the same timetable.
      //
      // The variability ensures that plans up to {variability} can be considered
      // as the top plan.
      variability: number;
    } = {
      iterations: 100,
      generatePerIteration: 100,
      mutationProbability: 0.2,
      iterationSelectionAmount: 10,
      returnTopN: 25,
      seed: "abcdefghijklmnopqrstuvwxyz",
      variability: 0.5,
    }
  ) {
    const rng = seedrandom(options.seed);

    // Initialize the iteration timetables.
    let iterationTimetables = new Array<GeneratedTimetable>(options.iterations);
    for (let i = 0; i < options.generatePerIteration; i++) {
      iterationTimetables[i] = this.createRandomTimetable(rng);
    }

    for (let i = 0; i < options.iterations; i++) {
      const parents = this.getTopTimetables(
        iterationTimetables,
        options.iterationSelectionAmount,
        true
      ).map((timetable) => timetable.timetable);

      // Pad the newTimetables if necessary.
      while (parents.length < options.iterationSelectionAmount) {
        parents.push(this.createRandomTimetable(rng));
      }

      const nextGeneration: GeneratedTimetable[] = [];
      // Minimally, we will move the parents into the next generation.
      for (const parent of parents) {
        nextGeneration.push(parent);
      }

      // Then using the parents, we will generate the next generation.
      while (nextGeneration.length < options.generatePerIteration) {
        const child = this.createChildTimetable(
          rng,
          parents,
          options.mutationProbability
        );
        nextGeneration.push(child);
      }

      iterationTimetables = nextGeneration;
    }

    const topN = this.getTopTimetables(
      iterationTimetables,
      options.returnTopN,
      true
    );
    if (topN.length <= 0) {
      topN.forEach((timetable) => {
        this.reconcileMissingIndexes(timetable.timetable);
      });
      return topN;
    }

    const mean =
      topN.reduce((acc, timetable) => acc + timetable.score, 0) / topN.length;
    const variance =
      topN.reduce(
        (acc, timetable) => acc + Math.pow(timetable.score - mean, 2),
        0
      ) / topN.length;
    const sd = Math.sqrt(variance);

    const maxScore = topN[0].score;
    const threshold = Math.max(
      maxScore - options.variability * sd,
      maxScore * (1 - 0.1) // Cap at 10% of the max score.
    );

    // First we get all plans index that are within the threshold.
    const firstIndexWithinThreshold = topN.findIndex(
      (timetable) => timetable.score <= threshold
    );

    // Shuffle the plans within {variability} standard deviation of the max.
    const withinThreshold = topN.slice(0, firstIndexWithinThreshold);
    const outsideThreshold = topN.slice(firstIndexWithinThreshold, topN.length);

    // Shuffle the plans inside 1SD.
    for (let i = 0; i < withinThreshold.length; i++) {
      const j = Math.floor(rng.quick() * (withinThreshold.length - i)) + i;
      const temp = withinThreshold[i];
      withinThreshold[i] = withinThreshold[j];
      withinThreshold[j] = temp;
    }

    const newTopN = withinThreshold.concat(outsideThreshold);

    newTopN.forEach((timetable) => {
      this.reconcileMissingIndexes(timetable.timetable);
    });

    console.log(this.evaluateTimetable(newTopN[0].timetable, true));

    return newTopN;
  }
}
