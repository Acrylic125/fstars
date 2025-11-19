import { CreateTimetable } from "@/components/timetable/create";
import { MainNavbar } from "@/components/nav/main-navbar";
import { db } from "@/db";
import { programsTable } from "@/db/schema";
import { eq, not } from "drizzle-orm";
import { Suspense } from "react";

export const revalidate = 86400; // 24 hours

export default async function Home() {
  const programs = await db
    .select({
      name: programsTable.name,
      code: programsTable.code,
      subCode: programsTable.subCode,
      year: programsTable.year,
      type: programsTable.type,
    })
    .from(programsTable)
    // We exclude BDES / Global Load because they are not real programs
    .where(not(eq(programsTable.code, "GLOAD")));
  return (
    <main className="flex flex-col w-full">
      <MainNavbar />
      <div className="flex flex-col items-center h-[calc(100svh-3.5rem)] md:h-[calc(100svh-4rem)] overflow-auto">
        <div className="flex flex-col w-full h-full items-center py-10">
          <Suspense>
            <CreateTimetable programs={programs} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
