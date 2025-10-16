import { MainNavbar } from "@/components/nav/main-navbar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { db } from "@/db";
import { courseIndexClassesTable } from "@/db/schema";
import { and, eq, gte, lte, not, or, sql } from "drizzle-orm";

export default async function VacentClassroomsPage() {
  // Current time and day
  const currentTime = new Date();
  const currentDay = currentTime.getDay();
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  //   const currentDay = 1;
  //   const currentHour = 10;
  //   const currentMinute = 0;

  const allVenues = await db
    .selectDistinctOn([courseIndexClassesTable.venue], {
      venue: courseIndexClassesTable.venue,
    })
    .from(courseIndexClassesTable)
    .where(
      and(
        not(eq(courseIndexClassesTable.venue, "ONLINE")),
        eq(courseIndexClassesTable.day, currentDay)
      )
    );

  const classroomsInUseNow = await db
    .selectDistinctOn([courseIndexClassesTable.venue], {
      venue: courseIndexClassesTable.venue,
    })
    .from(courseIndexClassesTable)
    .where(
      and(
        not(eq(courseIndexClassesTable.venue, "ONLINE")),
        // Current day and time
        eq(courseIndexClassesTable.day, currentDay),
        // Current time must be between the start and end time of the class
        // Convert to minutes for easier comparison
        and(
          lte(
            sql`${courseIndexClassesTable.timeFromHour} * 60 + ${courseIndexClassesTable.timeFromMinute}`,
            sql`${currentHour} * 60 + ${currentMinute}`
          ),
          gte(
            sql`${courseIndexClassesTable.timeToHour} * 60 + ${courseIndexClassesTable.timeToMinute}`,
            sql`${currentHour} * 60 + ${currentMinute}`
          )
        )
      )
    );

  const vacantClassrooms = allVenues.filter(
    (venue) =>
      !classroomsInUseNow.some((classroom) => classroom.venue === venue.venue)
  );

  return (
    <main className="flex flex-col w-full">
      <MainNavbar />
      <ScrollArea className="relative w-full flex flex-col h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] overflow-x-auto">
        <div className="w-full flex flex-col items-center">
          <div className="w-full flex flex-col items-center max-w-ui mx-auto px-4 py-8 md:px-8 gap-4">
            <h1 className="w-full text-2xl font-bold">Vacant Classrooms</h1>
            <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vacantClassrooms.map((vacantClassroom) => (
                <div key={vacantClassroom.venue}>{vacantClassroom.venue}</div>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </main>
  );
}
