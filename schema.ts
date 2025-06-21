import { z } from "zod";

// Define the data structures
export const TimeSchema = z.object({
  hour: z.number().min(0).max(23),
  minute: z.number().min(0).max(59),
});

export const DaySchema = z.enum([
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
  "SAT",
  "SUN",
]);
export const TypeSchema = z.enum(["LAB", "LEC", "TUT", "LEC/STUDIO"]);

export const ClassSchema = z.object({
  type: TypeSchema,
  day: DaySchema,
  timeFrom: TimeSchema,
  timeTo: TimeSchema,
});

export const IndexSchema = z.object({
  index: z.string(),
  classes: z.array(ClassSchema),
});

export const CourseSchema = z.object({
  course: z.string(),
  indices: z.array(IndexSchema),
});

export const CourseListSchema = z.array(CourseSchema);

export type Time = z.infer<typeof TimeSchema>;
export type Day = z.infer<typeof DaySchema>;
export type Class = z.infer<typeof ClassSchema>;
export type Index = z.infer<typeof IndexSchema>;
export type Course = z.infer<typeof CourseSchema>;
