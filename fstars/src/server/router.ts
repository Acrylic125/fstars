import { z } from "zod";
import { createTRPCRouter, publicProcedure, router } from "./trpc";
import { db } from "@/db";
import { coursesTable } from "@/db/schema";
import { like, or } from "drizzle-orm";

export const appRouter = createTRPCRouter({
  findCourses: publicProcedure
    .input(
      z.object({
        phrase: z.string(),
      })
    )
    .query(async ({ input }) => {
      const courses = await db
        .select()
        .from(coursesTable)
        .where(
          or(
            like(coursesTable.name, `%${input.phrase}%`),
            like(coursesTable.code, `%${input.phrase}%`)
          )
        )
        .limit(10);
      return courses;
    }),
});

export type AppRouter = typeof appRouter;
