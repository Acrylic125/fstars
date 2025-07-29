import { z } from "zod";

export const ProgramSchema = z.object({
  name: z.string(),
  code: z.string(),
  subCode: z.string().optional().nullable(),
  year: z.number().optional().nullable(),
});

export type Program = z.infer<typeof ProgramSchema>;

export const AcadYearSchema = z.object({
  yearCode: z.string(),
  semesterCode: z.string(),
});

export type AcadYear = z.infer<typeof AcadYearSchema>;
