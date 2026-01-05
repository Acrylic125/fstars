import z from "zod";
import { TimetableIdSchema, TimetableSchema } from "./timetable-store";
import {
  TimetableGeneratorIdSchema,
  TimetableGeneratorSchema,
} from "./timetable-generator-store";
import superjson from "superjson";

export const ExportTimetableFileSchema = z.object({
  version: z.literal(1).default(1),
  timetables: z.map(TimetableIdSchema, TimetableSchema),
  generators: z.map(TimetableGeneratorIdSchema, TimetableGeneratorSchema),
});

export function exportTimetable(
  exportTimetableFile: z.infer<typeof ExportTimetableFileSchema>
) {
  // Serialize to json using superjson
  const json = superjson.serialize(exportTimetableFile);
  return JSON.stringify(json, null, 2);
}

export async function downloadObjectAsJSONFile(json: any, filename: string) {
  const a = document.createElement("a");
  const file = new Blob([json], { type: "application/json" });
  a.href = URL.createObjectURL(file);
  a.download = filename;
  a.click();
}

export async function downloadTextFile(
  text: string,
  filename: string,
  mimeType = "text/plain"
) {
  const a = document.createElement("a");
  const file = new Blob([text], { type: mimeType });
  a.href = URL.createObjectURL(file);
  a.download = filename;
  a.click();
}
