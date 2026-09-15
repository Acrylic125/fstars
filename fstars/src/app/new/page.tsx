import { CreateTimetable } from "@/components/timetable/create";
import { MainNavbar } from "@/components/nav/main-navbar";
import { getPrograms } from "@/server/programs";
import { Suspense } from "react";

export default async function Home() {
  const programs = await getPrograms();
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
