import { type CourseClasses } from "@/generator/utils";
import { type CourseCode } from "./timetable-store";
import { GeneticGenerator } from "../../generator/genetic-generator";
import { type TimetableGenerator } from "./timetable-generator-store";

// Web Worker for generating timetables
addEventListener(
  "message",
  (
    e: MessageEvent<{
      factors: TimetableGenerator["factors"];
      courses: Record<CourseCode, CourseClasses>;
      seed: string;
    }>
  ) => {
    const generator = new GeneticGenerator(
      new Map(
        Object.entries(e.data.courses).map(([courseCode, course]) => [
          courseCode,
          course,
        ])
      ),
      e.data.factors,
      {
        minsConstituteAsConsecutive: 10,
        isSkewedThresholdSD: 3,
      }
    );

    const timetables = generator.generate({
      iterations: 100,
      generatePerIteration: 100,
      mutationProbability: 0.2,
      iterationSelectionAmount: 10,
      returnTopN: 25,
      seed: e.data.seed,
      variability: 0.5,
    });
    postMessage(timetables);
  }
);
