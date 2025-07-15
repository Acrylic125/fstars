import { z } from "zod";
import { createTRPCRouter, publicProcedure, router } from "./trpc";
import { db } from "@/db";
import {
  courseIndexSourcesTable,
  courseIndexTable,
  coursesTable,
  programsTable,
} from "@/db/schema";
import { and, eq, exists, inArray, like, or, sql } from "drizzle-orm";
import { AcadYearSchema, ProgramSchema } from "@/lib/types";

export const appRouter = createTRPCRouter({
  getCoursesByCodes: publicProcedure
    .input(z.object({ codes: z.array(z.string()).max(10) }))
    .query(async ({ input }) => {
      console.log("getCoursesByCodes", input.codes);
      if (input.codes.length === 0) return [];
      const courses = await db
        .select()
        .from(coursesTable)
        .where(inArray(coursesTable.code, input.codes));
      return courses;
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
