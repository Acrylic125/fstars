import { CourseClasses } from "@/generator/utils";
import { CourseCode } from "./timetable-store";
import { GeneticGenerator } from "@/generator/genetic-generator";
import { type TimetableGenerator } from "./timetable-generator-store";

// Web Worker for generating timetables
self.onmessage = function (
  e: MessageEvent<{
    factors: TimetableGenerator["factors"];
    courses: Record<CourseCode, CourseClasses>;
  }>
) {
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
  console.log("Generating timetables");
  const timetables = generator.generate({
    iterations: 100,
    generatePerIteration: 100,
    mutationProbability: 0.2,
    iterationSelectionAmount: 10,
    returnTopN: 25,
    seed: "abcdefghijklmnopqrstuvwxyz",
  });
  self.postMessage(timetables);
  console.log("Timetables generated");
};

// function pi(n: number) {
//   console.log("Called");
//   let v = 0;
//   for (let i = 1; i <= n; i += 4) {
//     // increment by 4
//     v += 1 / i - 1 / (i + 2); // add the value of the series
//   }
//   return 4 * v; // apply the factor at last
// }
