import { Plan } from "./timetable-store";

export const PlanCoursesSerializer = {
  noIndexSelection: "?",
  entryDelimiter: "\n",
  stripChars: ["\n", "\r", "\t", " "],
  deserializeEntryDelimiter: "\n",
  deserializeCourseIndexSplitDelimiter: ":",
};

export function serializePlanCourses(plan: Plan["courses"]) {
  return Array.from(plan.entries())
    .map(([courseCode, index]) => {
      return `${courseCode}: ${index.index ? index.index : PlanCoursesSerializer.noIndexSelection}`;
    })
    .join(PlanCoursesSerializer.entryDelimiter);
}

export function deserializePlanCourses(rawImport: string) {
  return rawImport
    .split(PlanCoursesSerializer.deserializeEntryDelimiter)
    .map((entry) => {
      const split = entry.split(
        PlanCoursesSerializer.deserializeCourseIndexSplitDelimiter
      );
      if (split.length !== 2) {
        return null;
      }

      // Strip with stripChars
      const courseCode = split[0].replace(
        new RegExp(`[${PlanCoursesSerializer.stripChars.join("")}]`, "g"),
        ""
      );
      const index = split[1].replace(
        new RegExp(`[${PlanCoursesSerializer.stripChars.join("")}]`, "g"),
        ""
      );
      return {
        courseCode,
        index: index === PlanCoursesSerializer.noIndexSelection ? null : index,
      };
    })
    .filter((course): course is NonNullable<typeof course> => course !== null);
}
