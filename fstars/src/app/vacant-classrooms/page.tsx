import { MainNavbar } from "@/components/nav/main-navbar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { db } from "@/db";
import {
  courseIndexClassesTable,
  courseIndexTable,
  coursesTable,
} from "@/db/schema";
import {
  and,
  arrayContains,
  asc,
  eq,
  gte,
  inArray,
  lte,
  not,
  sql,
} from "drizzle-orm";
import { DateTime } from "luxon";
import { formatTime } from "@/lib/utils";
import { VacantTable } from "@/components/vacant-classrooms/vacant-table";
import { getAcadWeek } from "@/lib/acad";
import { Badge } from "@/components/ui/badge";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = "force-dynamic";

async function TableLoader({
  currentDateTime,
  acadWeek,
}: {
  currentDateTime: DateTime;
  acadWeek: {
    acadYear: string;
    week: number;
  } | null;
}) {
  const currentDay = currentDateTime.weekday - 1;
  const currentHour = currentDateTime.hour;
  const currentMinute = currentDateTime.minute;
  const ignoreVenues = ["ONLINE", ""];

  const [allVenues, classroomsInUseNow] = await Promise.all([
    await db
      .selectDistinctOn([courseIndexClassesTable.venue], {
        venue: courseIndexClassesTable.venue,
      })
      .from(courseIndexClassesTable)
      .where(and(not(inArray(courseIndexClassesTable.venue, ignoreVenues)))),
    (async () => {
      if (!acadWeek) {
        return [];
      }
      let classroomsInUseNow = await db
        .selectDistinctOn([courseIndexClassesTable.venue], {
          venue: courseIndexClassesTable.venue,
          weeks: courseIndexClassesTable.weeks,
          day: courseIndexClassesTable.day,
          timeFromHour: courseIndexClassesTable.timeFromHour,
          timeFromMinute: courseIndexClassesTable.timeFromMinute,
          timeToHour: courseIndexClassesTable.timeToHour,
          timeToMinute: courseIndexClassesTable.timeToMinute,
          for: {
            code: coursesTable.code,
            name: coursesTable.name,
            index: courseIndexTable.index,
          },
        })
        .from(courseIndexClassesTable)
        .innerJoin(
          courseIndexTable,
          eq(courseIndexClassesTable.indexId, courseIndexTable.id)
        )
        .innerJoin(coursesTable, eq(courseIndexTable.courseId, coursesTable.id))
        .where(
          and(
            not(inArray(courseIndexClassesTable.venue, ignoreVenues)),
            // Current day and time
            eq(courseIndexClassesTable.day, currentDay),
            // Current week must be in the weeks of the class
            arrayContains(courseIndexClassesTable.weeks, [acadWeek.week]),
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

      return classroomsInUseNow;
    })(),
  ]);

  const classroomInUseMap = new Map<string, typeof classroomsInUseNow>();
  for (const classroom of classroomsInUseNow) {
    const key = classroom.venue;
    const cur = classroomInUseMap.get(key);
    if (!cur) {
      classroomInUseMap.set(key, [classroom]);
    } else {
      cur.push(classroom);
    }
  }
  // const classroomInUseSet = new Set(
  //   classroomsInUseNow.map((classroom) => classroom.venue)
  // );

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
    <VacantTable
      data={allVenues.map((venue) => {
        const classroomsInUse = classroomInUseMap.get(venue.venue);
        const status = !!classroomsInUse ? "in use" : "vacant";
        let freeUntil = "";
        if (status === "vacant") {
          freeUntil = timingMap.get(venue.venue) ?? "No more class";
        } else if (classroomsInUse) {
          const usedTill = classroomsInUse.reduce((acc, classroom) => {
            return Math.max(
              acc,
              classroom.timeToHour * 60 + classroom.timeToMinute
            );
          }, 0);
          freeUntil = `Used until ${formatTime(Math.floor(usedTill / 60), usedTill % 60)}`;
        }
        return {
          venue: venue.venue,
          status: status,
          freeUntil: freeUntil,
        };
      })}
    />
  );
}

export default async function VacentClassroomsPage() {
  const currentDateTime = DateTime.now().setZone("Asia/Singapore");
  // const currentDateTime = DateTime.now().setZone("Asia/Singapore").set({
  //   day: 14,
  //   hour: 12,
  //   minute: 30,
  // });
  const acadWeek = getAcadWeek(currentDateTime);

  return (
    <main className="flex flex-col w-full">
      <MainNavbar />
      <ScrollArea className="relative w-full flex flex-col h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] overflow-x-auto">
        <div className="w-full flex flex-col items-center">
          <div className="w-full flex flex-col items-center max-w-ui mx-auto px-4 py-8 md:px-8 gap-4">
            <div className="w-full flex flex-col gap-1">
              <h1 className="w-full text-2xl font-bold">Vacant Classrooms</h1>
              <div className="w-full flex flex-row items-center gap-2">
                <p className="text-muted-foreground">
                  As of {currentDateTime.toFormat("dd MMMM yyyy HH:mm:ss")}
                </p>
                {acadWeek ? (
                  <Badge>Wk {acadWeek.week}</Badge>
                ) : (
                  <Badge variant="secondary">Free Week</Badge>
                )}
              </div>
            </div>
            <div className="w-full">
              <Suspense fallback={<Skeleton className="w-full aspect-video" />}>
                <TableLoader
                  currentDateTime={currentDateTime}
                  acadWeek={acadWeek}
                />
              </Suspense>
            </div>
          </div>
        </div>
      </ScrollArea>
    </main>
  );
}
