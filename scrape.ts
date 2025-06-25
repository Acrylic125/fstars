import * as cheerio from "cheerio";
import path from "path";
import fs from "fs";
import {
  Time,
  Day,
  Class,
  Index,
  Course,
  ClassSchema,
  CourseSchema,
} from "./schema";
import { parseTeachingWeeks } from "./utils";
import { CourseCode, CourseIndexSchedule } from "./genetic-planner";
// Helper function to parse time string (e.g., "1830" -> { hour: 18, minute: 30 })
function parseTime(timeStr: string): Time {
  const hour = parseInt(timeStr.substring(0, 2));
  const minute = parseInt(timeStr.substring(2, 4));
  return { hour, minute };
}

// Helper function to parse time range (e.g., "1830-2220" -> { timeFrom: { hour: 18, minute: 30 }, timeTo: { hour: 22, minute: 20 } })
function parseTimeRange(timeRange: string): { timeFrom: Time; timeTo: Time } {
  const [from, to] = timeRange.split("-");
  return {
    timeFrom: parseTime(from),
    timeTo: parseTime(to),
  };
}

function scrapePageForCourses(html: string) {
  const results: Course[] = [];
  // Find all course sections
  const $ = cheerio.load(html);
  $("table").each((tableIndex, table) => {
    const $table = $(table);

    // Look for course code in the first table (course info table)
    const courseCodeElement = $table.find(
      "td:first-child b font[color='#0000FF']"
    );
    if (courseCodeElement.length > 0) {
      const courseCode = courseCodeElement.text().trim();

      // Find the next table which contains the schedule
      const nextTable = $table.next("table");
      if (nextTable.length > 0) {
        const $scheduleTable = $(nextTable);
        const indexMap: Record<string, Class[]> = {};
        let lastIndex = "";

        // Parse schedule rows
        $scheduleTable.find("tr").each((rowIndex, row) => {
          const $row = $(row);
          const cells = $row.find("td");

          // Skip header row and rows without enough cells
          if (rowIndex === 0 || cells.length < 7) return;

          let index = $row.find("td:first-child b").text().trim();
          if (index) {
            lastIndex = index;
          } else {
            index = lastIndex;
          }
          const type = $row.find("td:nth-child(2) b").text().trim();
          const day = $row.find("td:nth-child(4) b").text().trim();
          const time = $row.find("td:nth-child(5) b").text().trim();
          const venue = $row.find("td:nth-child(6) b").text().trim();
          const remarks = $row.find("td:nth-child(7) b").text().trim();
          const weeks = parseTeachingWeeks(remarks);

          // Only process rows with valid data
          if (
            index &&
            type &&
            day &&
            time &&
            day.match(/^(MON|TUE|WED|THU|FRI|SAT|SUN)$/)
          ) {
            try {
              const timeRange = parseTimeRange(time);
              const classData: Class = {
                type: type as Class["type"],
                day: day as Day,
                timeFrom: timeRange.timeFrom,
                timeTo: timeRange.timeTo,
                venue,
                weeks: weeks ?? [],
                remarks,
              };

              // Validate with Zod
              ClassSchema.parse(classData);
              if (!indexMap[index]) indexMap[index] = [];
              indexMap[index].push(classData);
            } catch (error) {
              console.warn(`Failed to parse class for index ${index}:`, error);
            }
          }
        });

        const indices: Index[] = Object.entries(indexMap).map(
          ([index, classes]) => ({
            index,
            classes,
            sources: [],
          })
        );

        if (indices.length > 0) {
          const courseData: Course = {
            course: courseCode,
            indices,
          };

          // Validate with Zod
          try {
            CourseSchema.parse(courseData);
            results.push(courseData);
          } catch (error) {
            console.warn(
              `Failed to validate course data for ${courseCode}:`,
              error
            );
          }
        }
      }
    }
  });
  return results;
}

const rawSchedulesDir = path.resolve(__dirname, "raw-schedules");
const rawSchedules = fs.readdirSync(rawSchedulesDir);

const courseSchedules = new Map<CourseCode, Course>();
// course code -> serialized course
// const checkDuplicates = new Map<string, string>();
for (const rawSchedule of rawSchedules) {
  const html = fs.readFileSync(
    path.resolve(rawSchedulesDir, rawSchedule),
    "utf8"
  );
  const filename = rawSchedule.split(".")[0];
  const courses = scrapePageForCourses(html);
  for (const course of courses) {
    const cur = courseSchedules.get(course.course);
    if (cur) {
      const curIndexPositions = new Map<string, number>(
        cur.indices.map((index, i) => {
          return [index.index, i];
        })
      );
      for (const index of course.indices) {
        const i = curIndexPositions.get(index.index);
        if (i !== undefined) {
          console.log(`Already have index, ${index.index}. Adding source`);
          const curIndex = cur.indices[i];
          curIndex.sources.push(filename);
          continue;
        }
        cur.indices.push(index);
      }
      continue;
    }
    for (const index of course.indices) {
      index.sources.push(filename);
    }
    courseSchedules.set(course.course, course);
  }
}

const results = Array.from(courseSchedules.values());
// console.log(results)
fs.writeFileSync(
  path.resolve(__dirname, "all-results.json"),
  JSON.stringify(results, null, 2)
);
