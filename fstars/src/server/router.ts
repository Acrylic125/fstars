import { z } from "zod";
import { createTRPCRouter, publicProcedure, router } from "./trpc";
import { db } from "@/db";
import {
  courseIndexClassesTable,
  courseIndexSourcesTable,
  courseIndexTable,
  coursesTable,
  programsTable,
} from "@/db/schema";
import { and, eq, exists, inArray, like, not, or, sql } from "drizzle-orm";
import { AcadYearSchema, ProgramSchema } from "@/lib/types";
import { CourseCode } from "@/components/timetable/timetable-store";
import {
  CourseClasses,
  IndexClass,
  Time,
  toTimeAsArray,
} from "@/generator/utils";

export const appRouter = createTRPCRouter({
  getCoursesByCodes: publicProcedure
    .input(z.object({ codes: z.array(z.string()).max(10) }))
    .query(async ({ input }) => {
      if (input.codes.length === 0) return [];
      const courses = await db
        .select()
        .from(coursesTable)
        .where(inArray(coursesTable.code, input.codes));
      return courses;
    }),
  getProgramExcludedCourseIndexes: publicProcedure
    .input(
      z.object({
        courseCode: z.string(),
        program: ProgramSchema,
        acadYear: AcadYearSchema,
      })
    )
    .query(async ({ input }) => {
      const courseIndexes = await db
        .select({
          id: courseIndexTable.id,
          index: courseIndexTable.index,
        })
        .from(courseIndexTable)
        .innerJoin(coursesTable, eq(coursesTable.id, courseIndexTable.courseId))
        .where(
          and(
            not(
              exists(
                db
                  .select({ id: courseIndexSourcesTable.id })
                  .from(courseIndexSourcesTable)
                  .innerJoin(
                    programsTable,
                    eq(programsTable.id, courseIndexSourcesTable.source)
                  )
                  .where(
                    and(
                      eq(courseIndexSourcesTable.indexId, courseIndexTable.id),
                      eq(programsTable.code, input.program.code),
                      eq(programsTable.subCode, input.program.subCode ?? ""),
                      eq(programsTable.year, input.program.year)
                    )
                  )
              )
            ),
            eq(coursesTable.code, input.courseCode),
            eq(coursesTable.ay, input.acadYear.yearCode),
            eq(coursesTable.semester, input.acadYear.semesterCode)
          )
        );
      return courseIndexes;
    }),
  getCourseIndexClasses: publicProcedure
    .input(
      z.object({
        courses: z
          .array(
            z.object({
              courseCode: z.string(),
              index: z.string(),
            })
          )
          .max(10),
        acadYear: AcadYearSchema,
      })
    )
    .query(async ({ input }) => {
      if (input.courses.length === 0) return [];
      const courseClasses = await db
        .select({
          index: courseIndexTable.index,
          course: {
            code: coursesTable.code,
            name: coursesTable.name,
          },
          venue: courseIndexClassesTable.venue,
          remarks: courseIndexClassesTable.remarks,
          weeks: courseIndexClassesTable.weeks,
          type: courseIndexClassesTable.type,
          day: courseIndexClassesTable.day,
          from: {
            hour: courseIndexClassesTable.timeFromHour,
            minute: courseIndexClassesTable.timeFromMinute,
          },
          to: {
            hour: courseIndexClassesTable.timeToHour,
            minute: courseIndexClassesTable.timeToMinute,
          },
        })
        .from(courseIndexClassesTable)
        .innerJoin(
          courseIndexTable,
          eq(courseIndexTable.id, courseIndexClassesTable.indexId)
        )
        .innerJoin(coursesTable, eq(coursesTable.id, courseIndexTable.courseId))
        .where(
          and(
            or(
              ...input.courses.map((c) =>
                and(
                  eq(coursesTable.code, c.courseCode),
                  eq(courseIndexTable.index, c.index)
                )
              )
            ),
            eq(coursesTable.ay, input.acadYear.yearCode),
            eq(coursesTable.semester, input.acadYear.semesterCode)
          )
        );
      return courseClasses;
    }),
  getCourseClasses: publicProcedure
    .input(
      z.object({
        courseCodes: z.array(z.string()).max(10),
        acadYear: AcadYearSchema,
      })
    )
    .query(async ({ input }) => {
      if (input.courseCodes.length === 0) return [];
      const courseClasses = await db
        .select({
          index: courseIndexTable.index,
          course: {
            code: coursesTable.code,
            name: coursesTable.name,
          },
          weeks: courseIndexClassesTable.weeks,
          day: courseIndexClassesTable.day,
          from: {
            hour: courseIndexClassesTable.timeFromHour,
            minute: courseIndexClassesTable.timeFromMinute,
          },
          to: {
            hour: courseIndexClassesTable.timeToHour,
            minute: courseIndexClassesTable.timeToMinute,
          },
        })
        .from(courseIndexClassesTable)
        .innerJoin(
          courseIndexTable,
          eq(courseIndexTable.id, courseIndexClassesTable.indexId)
        )
        .innerJoin(coursesTable, eq(coursesTable.id, courseIndexTable.courseId))
        .where(
          and(
            inArray(coursesTable.code, input.courseCodes),
            eq(coursesTable.ay, input.acadYear.yearCode),
            eq(coursesTable.semester, input.acadYear.semesterCode)
          )
        );

      let courseIndexClassesMap: Record<CourseCode, CourseClasses> = {};

      // First, group by course code.
      const courseClassesGrouped = new Map<CourseCode, typeof courseClasses>();
      for (const courseClass of courseClasses) {
        const courseCode = courseClass.course.code;
        const cur = courseClassesGrouped.get(courseCode);
        if (!cur) {
          courseClassesGrouped.set(courseCode, [courseClass]);
        } else {
          cur.push(courseClass);
        }
      }

      // Then, within each course code, group by index.
      for (const [courseCode, courseClasses] of courseClassesGrouped) {
        let courseIndexClasses: CourseClasses = {
          courseCode,
          indexes: [],
        };

        // Each course class holds groups of index classes.
        const indexClassesGrouped: Map<string, IndexClass[]> = new Map();
        for (const courseClass of courseClasses) {
          const index = courseClass.index;
          const cur = indexClassesGrouped.get(index);
          if (!cur) {
            indexClassesGrouped.set(index, [
              {
                startTime: toTimeAsArray(courseClass.from),
                endTime: toTimeAsArray(courseClass.to),
                day: courseClass.day,
                weeks: courseClass.weeks,
              },
            ]);
          } else {
            cur.push({
              startTime: toTimeAsArray(courseClass.from),
              endTime: toTimeAsArray(courseClass.to),
              day: courseClass.day,
              weeks: courseClass.weeks,
            });
          }
        }

        // Finally, for each index, we merge the index classes to reduce redundancy.
        for (const [index, indexClasses] of indexClassesGrouped) {
          // Day-start_hour:start_minute-end_hour:end_minute
          const merged: Map<
            `${number}-${number}:${number}-${number}:${number}`,
            IndexClass
          > = new Map();
          for (const indexClass of indexClasses) {
            const key =
              `${indexClass.day}-${indexClass.startTime[0]}:${indexClass.startTime[1]}-${indexClass.endTime[0]}:${indexClass.endTime[1]}` as const;
            const cur = merged.get(key);
            if (!cur) {
              merged.set(key, indexClass);
            } else {
              cur.weeks.push(...indexClass.weeks);
            }
          }

          courseIndexClasses.indexes.push({
            index,
            classes: Array.from(merged.values()),
          });
        }

        courseIndexClassesMap[courseCode] = courseIndexClasses;
      }

      return courseIndexClassesMap;
    }),
  findCourseIndexes: publicProcedure
    .input(
      z.object({
        phrase: z.string(),
        courseCode: z.string(),
        acadYear: AcadYearSchema,
      })
    )
    .query(async ({ input }) => {
      if (input.phrase === "") {
        const courseIndexes = await db
          .select({
            id: courseIndexTable.id,
            index: courseIndexTable.index,
          })
          .from(courseIndexTable)
          .innerJoin(
            coursesTable,
            eq(coursesTable.id, courseIndexTable.courseId)
          )
          .where(
            and(
              eq(coursesTable.code, input.courseCode),
              eq(coursesTable.ay, input.acadYear.yearCode),
              eq(coursesTable.semester, input.acadYear.semesterCode)
            )
          );
        return courseIndexes;
      }
      const courseIndexes = await db
        .select({
          id: courseIndexTable.id,
          index: courseIndexTable.index,
        })
        .from(courseIndexTable)
        .innerJoin(coursesTable, eq(coursesTable.id, courseIndexTable.courseId))
        .where(
          and(
            like(courseIndexTable.index, `%${input.phrase}%`),
            eq(coursesTable.code, input.courseCode),
            eq(coursesTable.ay, input.acadYear.yearCode),
            eq(coursesTable.semester, input.acadYear.semesterCode)
          )
        );
      return courseIndexes;
    }),
  findCourses: publicProcedure
    .input(
      z.object({
        phrase: z.string(),
        program: ProgramSchema,
        acadYear: AcadYearSchema,
      })
    )
    .query(async ({ input }) => {
      if (input.phrase === "") {
        const res = await db
          .select({
            courses: coursesTable,
          })
          .from(coursesTable)
          .where(
            and(
              eq(coursesTable.ay, input.acadYear.yearCode),
              eq(coursesTable.semester, input.acadYear.semesterCode),
              // Subquery to check if there's a matching program
              exists(
                db
                  .select({ id: courseIndexTable.id })
                  .from(courseIndexTable)
                  .innerJoin(
                    courseIndexSourcesTable,
                    eq(courseIndexSourcesTable.indexId, courseIndexTable.id)
                  )
                  .innerJoin(
                    programsTable,
                    eq(programsTable.id, courseIndexSourcesTable.source)
                  )
                  .where(
                    and(
                      eq(courseIndexTable.courseId, coursesTable.id),
                      eq(programsTable.code, input.program.code),
                      eq(programsTable.subCode, input.program.subCode ?? ""),
                      eq(programsTable.year, input.program.year)
                    )
                  )
              )
            )
          )
          .limit(10);

        return res.map((course) => course.courses);
      }
      try {
        const searchTerms = input.phrase
          .split(/\s+/)
          .filter(Boolean)
          .map((term) => `${term}:*`)
          .join(" & ");

        const courses = await db
          .select()
          .from(coursesTable)
          .where(
            sql`${coursesTable.searchText} @@ to_tsquery('english', ${searchTerms})`
          )
          .limit(10);
        return courses;
      } catch (e) {
        console.error("Failed to search courses:", e);
        return [];
      }
    }),
});

export type AppRouter = typeof appRouter;
