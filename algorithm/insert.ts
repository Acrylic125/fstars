import { ProgramCourseListSchema, MetadataSchema, Days } from "./schema";
import { db } from "./db";
import {
  courseIndexClassesTable,
  courseIndexSourcesTable,
  courseIndexTable,
  coursesTable,
  programsTable,
} from "./db/schema";
import path from "path";
import fs from "fs";
import { and, eq } from "drizzle-orm";

async function getMetadata(dir: string) {
  const metadata = MetadataSchema.parse(
    JSON.parse(fs.readFileSync(path.resolve(dir, "metadata.json"), "utf8"))
  );
  return metadata;
}

async function getScrapedResults(dir: string) {
  const resultsPath = path.resolve(dir, "all-results.json");
  const all = ProgramCourseListSchema.parse(
    JSON.parse(fs.readFileSync(resultsPath, "utf8"))
  );
  return all;
}

function* batchIteration(batchSize: number, total: number) {
  for (let i = 0; i < total; i += batchSize) {
    const batch = i;
    const end = Math.min(i + batchSize, total);
    yield { batch, end };
  }
}

async function doProgramsInsert() {
  const metadata = await getMetadata(path.resolve("./raw-schedules"));
  const programs = metadata.map((m) => m.program);
  await db.insert(programsTable).values(programs);
  console.log("Programs inserted");
}

async function doCoursesInsert(ay: string, semester: string) {
  const all = await getScrapedResults(__dirname);
  const courses = all.map((c) => {
    return {
      code: c.course.code,
      name: c.course.name,
      au: c.au,
      ay,
      semester,
    };
  });
  await db.insert(coursesTable).values(courses);
  console.log("Courses inserted");
}

async function doCoursesIndexInsert(ay: string, semester: string) {
  const all = await getScrapedResults(__dirname);
  const allCourses = await db
    .select()
    .from(coursesTable)
    .where(and(eq(coursesTable.ay, ay), eq(coursesTable.semester, semester)));

  const courseIndexMap = new Map<string, number>();
  for (const course of allCourses) {
    courseIndexMap.set(course.code, course.id);
  }

  const allIndexes = [];
  for (const course of all) {
    const courseId = courseIndexMap.get(course.course.code);
    if (!courseId) {
      throw new Error(`Course ${course.course.code} not found`);
    }
    for (const index of course.indices) {
      allIndexes.push({
        index: index.index,
        courseId,
      });
    }
  }
  await db.insert(courseIndexTable).values(allIndexes);
  console.log("Courses indexes inserted");
}

async function doIndexClassesInsert(ay: string, semester: string) {
  const all = await getScrapedResults(__dirname);
  const allIndexesWithinAYSemester = await db
    .select()
    .from(courseIndexTable)
    .innerJoin(coursesTable, eq(courseIndexTable.courseId, coursesTable.id))
    .where(and(eq(coursesTable.ay, ay), eq(coursesTable.semester, semester)));

  const courseIndexMap = new Map<string, number>();
  for (const index of allIndexesWithinAYSemester) {
    courseIndexMap.set(
      `${index.courses.code}-${index.course_index.index}`,
      index.course_index.id
    );
  }

  const allIndexClasses = [];
  for (const course of all) {
    for (const index of course.indices) {
      const courseIndexId = courseIndexMap.get(
        `${course.course.code}-${index.index}`
      );
      if (!courseIndexId) {
        throw new Error(
          `Course index ${course.course.code}-${index.index} not found`
        );
      }
      for (const indexClass of index.classes) {
        const day = Days.indexOf(indexClass.day);
        if (day === -1) {
          throw new Error(`Invalid day: ${indexClass.day}`);
        }
        allIndexClasses.push({
          indexId: courseIndexId,
          timeFromHour: indexClass.timeFrom.hour,
          timeFromMinute: indexClass.timeFrom.minute,
          timeToHour: indexClass.timeTo.hour,
          timeToMinute: indexClass.timeTo.minute,
          venue: indexClass.venue,
          day,
          type: indexClass.type,
          remarks: indexClass.remarks,
          weeks: indexClass.weeks,
        });
      }
    }
  }

  for (const { batch, end } of batchIteration(1000, allIndexClasses.length)) {
    await db
      .insert(courseIndexClassesTable)
      .values(allIndexClasses.slice(batch, end));
  }

  console.log("Index classes inserted");
}

async function doInsertIndexSources(ay: string, semester: string) {
  const all = await getScrapedResults(__dirname);
  const allIndexesWithinAYSemester = await db
    .select()
    .from(courseIndexTable)
    .innerJoin(coursesTable, eq(courseIndexTable.courseId, coursesTable.id))
    .where(and(eq(coursesTable.ay, ay), eq(coursesTable.semester, semester)));
  const allPrograms = await db.select().from(programsTable);

  const courseIndexMap = new Map<string, number>();
  for (const index of allIndexesWithinAYSemester) {
    courseIndexMap.set(
      `${index.courses.code}-${index.course_index.index}`,
      index.course_index.id
    );
  }

  const programMap = new Map<string, number>();
  for (const program of allPrograms) {
    programMap.set(
      `${program.code}-${program.subCode}-${program.year}`,
      program.id
    );
  }

  const allIndexSources = [];
  for (const course of all) {
    for (const index of course.indices) {
      for (const source of index.sources) {
        const programId = programMap.get(
          `${source.code}-${source.subCode ?? ""}-${source.year}`
        );
        if (!programId) {
          throw new Error(
            `Program ${source.code}-${source.subCode ?? ""}-${source.year} not found in ${JSON.stringify(allPrograms)}`
          );
        }
        const indexId = courseIndexMap.get(
          `${course.course.code}-${index.index}`
        );
        if (!indexId) {
          throw new Error(
            `Index ${course.course.code}-${index.index} not found`
          );
        }
        allIndexSources.push({
          indexId,
          source: programId,
        });
      }
    }
  }

  for (const { batch, end } of batchIteration(1000, allIndexSources.length)) {
    await db
      .insert(courseIndexSourcesTable)
      .values(allIndexSources.slice(batch, end));
  }
  console.log("Index sources inserted");
}

(async () => {
  const ay = "25/26";
  const sem = "1";
  // await doProgramsInsert();
  // await doCoursesInsert(ay, sem);
  // await doCoursesIndexInsert(ay, sem);
  // await doIndexClassesInsert(ay, sem);
  await doInsertIndexSources(ay, sem);
})();
