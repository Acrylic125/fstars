import { MainNavbar } from "@/components/nav/main-navbar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { db } from "@/db";
import { courseIndexClassesTable } from "@/db/schema";
import { and, asc, eq, gte, inArray, lte, not, or, sql } from "drizzle-orm";
import Link from "next/link";
import { DateTime } from "luxon";
import { formatTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { VacantTable } from "@/components/vacant-classrooms/vacant-table";

export default async function VacentClassroomsPage() {
  const currentDateTime = DateTime.now().setZone("Asia/Singapore");

  const currentDay = currentDateTime.weekday - 1;
  const currentHour = currentDateTime.hour;
  const currentMinute = currentDateTime.minute;

  const ignoreVenues = ["ONLINE", ""];

  const allVenues = await db
    .selectDistinctOn([courseIndexClassesTable.venue], {
      venue: courseIndexClassesTable.venue,
    })
    .from(courseIndexClassesTable)
    .where(and(not(inArray(courseIndexClassesTable.venue, ignoreVenues))));

  const classroomsInUseNow = await db
    .selectDistinctOn([courseIndexClassesTable.venue], {
      venue: courseIndexClassesTable.venue,
    })
    .from(courseIndexClassesTable)
    .where(
      and(
        not(inArray(courseIndexClassesTable.venue, ignoreVenues)),
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

  const classroomInUseSet = new Set(
    classroomsInUseNow.map((classroom) => classroom.venue)
  );

  // Get next time slot for each classroom
  const nextTimeSlots = await db
    .select({
      venue: courseIndexClassesTable.venue,
      // Get closest time slot after current time
      time: sql<number>`MIN(${courseIndexClassesTable.timeFromHour} * 60 + ${courseIndexClassesTable.timeFromMinute})`,
    })
    .from(courseIndexClassesTable)
    .where(
      and(
        inArray(
          courseIndexClassesTable.venue,
          allVenues.map((venue) => venue.venue)
        ),
        eq(courseIndexClassesTable.day, currentDay),
        gte(
          sql`${courseIndexClassesTable.timeFromHour} * 60 + ${courseIndexClassesTable.timeFromMinute}`,
          sql`${currentHour} * 60 + ${currentMinute}`
        )
      )
    )
    .groupBy(courseIndexClassesTable.venue)
    .orderBy(
      asc(
        sql`MIN(${courseIndexClassesTable.timeFromHour} * 60 + ${courseIndexClassesTable.timeFromMinute})`
      )
    );

  const timingMap = new Map<string, string>();
  for (const nextTimeSlot of nextTimeSlots) {
    const hours = Math.floor(nextTimeSlot.time / 60);
    const minutes = nextTimeSlot.time % 60;
    timingMap.set(nextTimeSlot.venue, formatTime(hours, minutes));
  }

  return (
    <main className="flex flex-col w-full">
      <MainNavbar />
      <ScrollArea className="relative w-full flex flex-col h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] overflow-x-auto">
        <div className="w-full flex flex-col items-center">
          <div className="w-full flex flex-col items-center max-w-ui mx-auto px-4 py-8 md:px-8 gap-4">
            <div className="w-full flex flex-col">
              <h1 className="w-full text-2xl font-bold">Vacant Classrooms</h1>
              <p className="text-muted-foreground">
                As of {currentDateTime.toFormat("yyyy-MM-dd HH:mm:ss")}
              </p>
            </div>
            <div className="w-full">
              <VacantTable
                data={allVenues.map((venue) => {
                  const status = classroomInUseSet.has(venue.venue)
                    ? "in use"
                    : "vacant";
                  let freeUntil = "";
                  if (status === "vacant") {
                    freeUntil = timingMap.get(venue.venue) ?? "No more class";
                  }
                  return {
                    venue: venue.venue,
                    status: status,
                    freeUntil: freeUntil,
                  };
                })}
              />
            </div>
            {/* <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allVenues.map((venue) => {
                if (classroomInUseSet.has(venue.venue)) {
                  return (
                    <Link
                      href={`/vacant-classrooms/${encodeURIComponent(venue.venue)}`}
                      key={venue.venue}
                      className="w-full bg-card border border-border rounded-md p-4"
                    >
                      <div className="flex flex-row items-center gap-2">
                        {venue.venue}{" "}
                        <Badge variant="destructive">In use</Badge>
                      </div>
                    </Link>
                  );
                }
                return (
                  <Link
                    href={`/vacant-classrooms/${encodeURIComponent(venue.venue)}`}
                    key={venue.venue}
                    className="w-full bg-card border border-border rounded-md p-4"
                  >
                    <div className="flex flex-row items-center gap-2">
                      {venue.venue}
                      <Badge variant="default">Vacant</Badge>
                    </div>
                  </Link>
                );
              })}
            </div> */}
          </div>
        </div>
      </ScrollArea>
    </main>
  );
}
