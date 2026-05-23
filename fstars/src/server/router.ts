import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "./trpc";
import { db } from "@/db";
import {
  campusTable,
  courseIndexClassesTable,
  courseIndexSourcesTable,
  courseIndexTable,
  coursesTable,
  examsTable,
  locationAltNamesTable,
  locationsTable,
  programsTable,
} from "@/db/schema";
import { and, eq, getTableColumns, inArray, or, sql } from "drizzle-orm";
import { AcadYearSchema, ProgramSchema } from "@/lib/types";
import { CourseCode } from "@/components/timetable/timetable-store";
import { CourseClasses, IndexClass, toTimeAsArray } from "@/generator/utils";
import { redis } from "@/cache/upstash";

const CourseIndexSchema = z
  .object({
    id: z.string(),
    index: z.string(),
  })
  .array();

const ExamSchema = z
  .object({
    date: z.string(),
    timeHour: z.number(),
    timeMinute: z.number(),
    duration: z.number(),
  })
  .nullable();

const CoursesSchema = z
  .object({
    id: z.number(),
    code: z.string(),
    name: z.string(),
    exam: ExamSchema,
  })
  .array();

export const appRouter = createTRPCRouter({
  getCoursesByCodes: publicProcedure
    .input(z.object({ ay: AcadYearSchema, codes: z.array(z.string()).max(10) }))
    .query(async ({ input }) => {
      if (input.codes.length === 0) return [];
      const courses = await db
        .select({
          id: coursesTable.id,
          code: coursesTable.code,
          name: coursesTable.name,
          au: coursesTable.au,
          exam: {
            date: examsTable.date,
            timeHour: examsTable.timeHour,
            timeMinute: examsTable.timeMinute,
            duration: examsTable.duration,
          },
        })
        .from(coursesTable)
        .leftJoin(examsTable, eq(examsTable.courseId, coursesTable.id))
        .where(
          and(
            inArray(coursesTable.code, input.codes),
            eq(coursesTable.ay, input.ay.yearCode),
            eq(coursesTable.semester, input.ay.semesterCode)
          )
        );
      return courses;
    }),
  getCourseIndexPairs: publicProcedure
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
      const courseIndexes = await db
        .select({
          course: {
            code: coursesTable.code,
          },
          index: courseIndexTable.index,
        })
        .from(courseIndexTable)
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
      return courseIndexes;
    }),
  getProgramExcludedCourseIndexes: publicProcedure
    .input(
      z.object({
        courseCode: z.string(),
        programs: z.array(ProgramSchema),
        acadYear: AcadYearSchema,
      })
    )
    .query(async ({ input }) => {
      const courseIndexes = await db
        .select({
          id: courseIndexTable.id,
          index: courseIndexTable.index,
          source: {
            code: programsTable.code,
            subCode: programsTable.subCode,
            year: programsTable.year,
            type: programsTable.type,
          },
        })
        .from(courseIndexTable)
        .innerJoin(coursesTable, eq(coursesTable.id, courseIndexTable.courseId))
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
            eq(coursesTable.code, input.courseCode),
            eq(coursesTable.ay, input.acadYear.yearCode),
            eq(coursesTable.semester, input.acadYear.semesterCode)
          )
        );

      const indexAndSources: Map<
        string,
        (typeof courseIndexes)[number]["source"][]
      > = new Map();
      for (const courseIndex of courseIndexes) {
        const cur = indexAndSources.get(courseIndex.index);
        if (!cur) {
          indexAndSources.set(courseIndex.index, [courseIndex.source]);
        } else {
          cur.push(courseIndex.source);
        }
      }

      // const excludeIndexes = new Set<string>();

      const allIndexes = new Set<string>();
      const programIndexes = new Set<string>();
      const gloadIndexes = new Set<string>();

      for (const courseIndex of courseIndexes) {
        const cur = indexAndSources.get(courseIndex.index);
        allIndexes.add(courseIndex.index);
        // let isSourcedFromInputPrograms = false;
        if (cur && cur.length >= 1) {
          for (const source of cur) {
            for (const program of input.programs) {
              if (source.year !== null && source.year !== program.year) {
                continue;
              }
              // console.log(source.code, program.code);
              if (source.code !== "GLOAD") {
                if (source.code !== program.code) {
                  continue;
                }
                if (source.subCode !== (program.subCode ?? null)) {
                  continue;
                }
                if (source.type !== program.type) {
                  continue;
                }
                programIndexes.add(courseIndex.index);
              } else {
                if (source.type !== program.type) {
                  continue;
                }
                gloadIndexes.add(courseIndex.index);
              }

              // Break out early if programIndexes and gloadIndexes have this index.
              if (
                programIndexes.has(courseIndex.index) &&
                gloadIndexes.has(courseIndex.index)
              ) {
                break;
              }
            }
          }
        }
      }

      const excludeIndexes = new Set<string>();
      for (const index of allIndexes) {
        if (programIndexes.size > 0) {
          if (!programIndexes.has(index)) {
            excludeIndexes.add(index);
          }
        } else {
          if (!gloadIndexes.has(index)) {
            excludeIndexes.add(index);
          }
        }
      }

      return Array.from(excludeIndexes);
    }),
  getProgramExcludedCourseIndexesMany: publicProcedure
    .input(
      z.object({
        courseCodes: z.array(z.string()).max(10),
        programs: z.array(ProgramSchema),
        acadYear: AcadYearSchema,
      })
    )
    .query(async ({ input }) => {
      const allCourseIndexes = await db
        .select({
          id: courseIndexTable.id,
          index: courseIndexTable.index,
          source: {
            code: programsTable.code,
            subCode: programsTable.subCode,
            year: programsTable.year,
            type: programsTable.type,
          },
          courseCode: coursesTable.code,
        })
        .from(courseIndexTable)
        .innerJoin(coursesTable, eq(coursesTable.id, courseIndexTable.courseId))
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
            inArray(coursesTable.code, input.courseCodes),
            eq(coursesTable.ay, input.acadYear.yearCode),
            eq(coursesTable.semester, input.acadYear.semesterCode)
          )
        );

      const courseIndexMap = new Map<string, typeof allCourseIndexes>();
      for (const courseIndex of allCourseIndexes) {
        const cur = courseIndexMap.get(courseIndex.courseCode);
        if (!cur) {
          courseIndexMap.set(courseIndex.courseCode, [courseIndex]);
        } else {
          cur.push(courseIndex);
        }
      }

      const result: Record<string, string[]> = {};
      for (const courseCode of input.courseCodes) {
        const courseIndexes = courseIndexMap.get(courseCode);
        if (!courseIndexes) {
          result[courseCode] = [];
          continue;
        }
        const indexAndSources: Map<
          string,
          (typeof courseIndexes)[number]["source"][]
        > = new Map();
        for (const courseIndex of courseIndexes) {
          const cur = indexAndSources.get(courseIndex.index);
          if (!cur) {
            indexAndSources.set(courseIndex.index, [courseIndex.source]);
          } else {
            cur.push(courseIndex.source);
          }
        }

        const allIndexes = new Set<string>();
        const programIndexes = new Set<string>();
        const gloadIndexes = new Set<string>();

        for (const courseIndex of courseIndexes) {
          const cur = indexAndSources.get(courseIndex.index);
          allIndexes.add(courseIndex.index);
          // let isSourcedFromInputPrograms = false;
          if (cur && cur.length >= 1) {
            for (const source of cur) {
              for (const program of input.programs) {
                if (source.year !== null && source.year !== program.year) {
                  continue;
                }
                if (source.code !== "GLOAD") {
                  if (source.code !== program.code) {
                    continue;
                  }
                  if (source.subCode !== (program.subCode ?? null)) {
                    continue;
                  }
                  if (source.type !== program.type) {
                    continue;
                  }
                  programIndexes.add(courseIndex.index);
                } else {
                  if (source.type !== program.type) {
                    continue;
                  }
                  gloadIndexes.add(courseIndex.index);
                }

                // Break out early if programIndexes and gloadIndexes have this index.
                if (
                  programIndexes.has(courseIndex.index) &&
                  gloadIndexes.has(courseIndex.index)
                ) {
                  break;
                }
              }
            }
          }
        }

        const excludeIndexes = new Set<string>();
        for (const index of allIndexes) {
          if (programIndexes.size > 0) {
            if (!programIndexes.has(index)) {
              excludeIndexes.add(index);
            }
          } else {
            if (!gloadIndexes.has(index)) {
              excludeIndexes.add(index);
            }
          }
        }

        result[courseCode] = Array.from(excludeIndexes);
      }

      return result;
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

      const venues = courseClasses.map((courseClass) => courseClass.venue);

      const _locationsRows = await db
        .select({
          altName: locationAltNamesTable.altName,
          area: locationsTable.building,
          location: locationsTable.name,
          longitude: locationsTable.longitude,
          latitude: locationsTable.latitude,
          z: locationsTable.z,
          campusId: campusTable.mazeMapCampusId,
          mazeMapIdentifier: locationsTable.mazeMapIdentifier,
        })
        .from(locationAltNamesTable)
        .innerJoin(
          locationsTable,
          eq(locationAltNamesTable.locationId, locationsTable.id)
        )
        .innerJoin(campusTable, eq(campusTable.id, locationsTable.campusId))
        .where(inArray(locationAltNamesTable.altName, venues));
      const locationsRows = _locationsRows.map((location) => {
        if (!location.mazeMapIdentifier)
          return {
            ...location,
            url: null,
          };
        return {
          ...location,
          // https://maps.ntu.edu.sg/?mazemap_share_url=https%3A%2F%2Fuse.mazemap.com%2F%3Futm_medium%3Dlongurl%23v%3D1%26config%3Dntu-sg%26zlevel%3D1%26center%3D103.681362%2C1.346618%26zoom%3D18%26sharepoitype%3Didentifier%26sharepoi%3DLT2A-01-01%26campusid%3D2123
          url: `https://maps.ntu.edu.sg/?mazemap_share_url=https%3A%2F%2Fuse.mazemap.com%2F%3Futm_medium%3Dlongurl%23v%3D1%26config%3Dntu-sg%26zlevel%3D${location.z}%26center%3D${location.longitude}%2C${location.latitude}%26zoom%3D18%26sharepoitype%3Didentifier%26sharepoi%3D${encodeURIComponent(encodeURIComponent(location.mazeMapIdentifier))}%26campusid%3D${location.campusId}`,
        };
      });

      const locationsMap = new Map<string, (typeof locationsRows)[number]>();
      for (const location of locationsRows) {
        const key = location.altName;
        if (!key) continue;
        locationsMap.set(key, location);
      }
      return courseClasses.map((courseClass) => {
        return {
          ...courseClass,
          location: locationsMap.get(courseClass.venue),
        };
      });
    }),
  getCourseClasses: publicProcedure
    .input(
      z.object({
        courseCodes: z.array(z.string()).max(10),
        acadYear: AcadYearSchema,
      })
    )
    .query(async ({ input }) => {
      let courseIndexClassesMap: Record<CourseCode, CourseClasses> = {};
      if (input.courseCodes.length === 0) return courseIndexClassesMap;
      const courseClasses = await db
        .select({
          index: courseIndexTable.index,
          course: {
            code: coursesTable.code,
            name: coursesTable.name,
          },
          weeks: courseIndexClassesTable.weeks,
          day: courseIndexClassesTable.day,
          type: courseIndexClassesTable.type,
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
                type: courseClass.type,
              },
            ]);
          } else {
            cur.push({
              startTime: toTimeAsArray(courseClass.from),
              endTime: toTimeAsArray(courseClass.to),
              day: courseClass.day,
              weeks: courseClass.weeks,
              type: courseClass.type,
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
        courseCode: z.string(),
        acadYear: AcadYearSchema,
      })
    )
    .query(async ({ input }) => {
      const key = `courseIndexes:${input.courseCode}_${input.acadYear.yearCode}_${input.acadYear.semesterCode}`;
      const cached = await redis.get(key);
      if (typeof cached === "string") {
        const parsed = CourseIndexSchema.safeParse(JSON.parse(cached));
        if (parsed.success) {
          return parsed.data;
        }
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
            eq(coursesTable.code, input.courseCode),
            eq(coursesTable.ay, input.acadYear.yearCode),
            eq(coursesTable.semester, input.acadYear.semesterCode)
          )
        );
      // Expires in 1 hour.
      try {
        const res = await redis.set(key, JSON.stringify(courseIndexes), {
          ex: 3600,
        });
        if (res !== "OK") {
          console.error("Failed to set cache:", res);
        }
      } catch (e) {
        console.error("Failed to set cache:", e);
      }
      return courseIndexes;
    }),
  findAllCourses: publicProcedure
    .input(
      z.object({
        acadYear: AcadYearSchema,
      })
    )
    .query(async ({ input }) => {
      // Cache key is versioned (v2) because the response shape changed.
      const key = `allCourses:v2:${input.acadYear.yearCode}_${input.acadYear.semesterCode}`;
      const cached = await redis.get(key);
      if (typeof cached === "string") {
        const parsed = CoursesSchema.safeParse(JSON.parse(cached));
        if (parsed.success) {
          return parsed.data;
        }
      }
      const courses = await db
        .select({
          id: coursesTable.id,
          code: coursesTable.code,
          name: coursesTable.name,
          exam: {
            date: examsTable.date,
            timeHour: examsTable.timeHour,
            timeMinute: examsTable.timeMinute,
            duration: examsTable.duration,
          },
        })
        .from(coursesTable)
        .leftJoin(examsTable, eq(examsTable.courseId, coursesTable.id))
        .where(
          and(
            eq(coursesTable.ay, input.acadYear.yearCode),
            eq(coursesTable.semester, input.acadYear.semesterCode)
          )
        );
      try {
        const res = await redis.set(key, JSON.stringify(courses), {
          ex: 3600,
        });
        if (res !== "OK") {
          console.error("Failed to set cache:", res);
        }
      } catch (e) {
        console.error("Failed to set cache:", e);
      }
      return courses;
    }),
  findCourses: publicProcedure
    .input(
      z.object({
        phrase: z.string(),
        // program: ProgramSchema,
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
              eq(coursesTable.semester, input.acadYear.semesterCode)
              // Subquery to check if there's a matching program
              // exists(
              //   db
              //     .select({ id: courseIndexTable.id })
              //     .from(courseIndexTable)
              //     .innerJoin(
              //       courseIndexSourcesTable,
              //       eq(courseIndexSourcesTable.indexId, courseIndexTable.id)
              //     )
              //     .innerJoin(
              //       programsTable,
              //       eq(programsTable.id, courseIndexSourcesTable.source)
              //     )
              //     .where(
              //       and(
              //         eq(courseIndexTable.courseId, coursesTable.id),
              //         eq(programsTable.code, input.program.code),
              //         eq(programsTable.subCode, input.program.subCode ?? ""),
              //         eq(programsTable.year, input.program.year)
              //       )
              //     )
              // )
            )
          )
          .limit(20);

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
            and(
              sql`${coursesTable.searchText} @@ to_tsquery('english', ${searchTerms})`,
              eq(coursesTable.ay, input.acadYear.yearCode),
              eq(coursesTable.semester, input.acadYear.semesterCode)
            )
          )
          .limit(20);
        return courses;
      } catch (e) {
        console.error("Failed to search courses:", e);
        return [];
      }
    }),
});

export type AppRouter = typeof appRouter;
