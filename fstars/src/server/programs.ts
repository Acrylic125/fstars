import "server-only";

import { db } from "@/db";
import { programsTable } from "@/db/schema";
import { eq, not } from "drizzle-orm";
import { cacheLife } from "next/cache";

export async function getPrograms() {
  "use cache";
  cacheLife("days");

  return db
    .select({
      name: programsTable.name,
      code: programsTable.code,
      subCode: programsTable.subCode,
      year: programsTable.year,
      type: programsTable.type,
    })
    .from(programsTable)
    .where(not(eq(programsTable.code, "GLOAD")));
}
