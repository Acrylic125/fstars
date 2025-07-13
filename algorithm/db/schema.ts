import {
  index,
  integer,
  pgTable,
  primaryKey,
  serial,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

export const programsTable = pgTable(
  "programs",
  {
    name: varchar({ length: 128 }).notNull(),
    code: varchar({ length: 32 }).notNull(),
    subCode: varchar({ length: 32 }).notNull().default(""),
    year: integer().notNull(),
  },
  (t) => [primaryKey({ columns: [t.code, t.subCode, t.year] })]
);

export const coursesTable = pgTable("courses", {
  code: varchar({ length: 32 }).notNull().primaryKey(),
  name: varchar({ length: 128 }).notNull(),
  au: integer().notNull(),
});

export const courseIndexTable = pgTable(
  "course_index",
  {
    id: serial().notNull().primaryKey(),
    index: varchar({ length: 32 }).notNull(),
    courseCode: varchar({ length: 32 }).notNull(),
  },
  (t) => [unique("idx_index_course_code").on(t.index, t.courseCode)]
);

export const courseIndexClassesTable = pgTable("course_index_classes", {
  id: serial().notNull().primaryKey(),
  indexId: integer().notNull(),
  timeFromHour: integer().notNull(),
  timeFromMinute: integer().notNull(),
  timeToHour: integer().notNull(),
  timeToMinute: integer().notNull(),
  venue: varchar({ length: 128 }).notNull(),
  day: integer().notNull(),
  type: varchar({ length: 32 }).notNull(),
  remarks: varchar({ length: 128 }).notNull(),
  weeks: integer().array().notNull(),
});
