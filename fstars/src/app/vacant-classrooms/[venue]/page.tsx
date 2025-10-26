import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { MainNavbar } from "@/components/nav/main-navbar";
import {
  VacantClassroomCalendar,
  VacantClassroomEvent,
} from "@/components/vacant-classrooms/vacant-classroom-calendar";
import {
  courseIndexClassesTable,
  courseIndexTable,
  coursesTable,
} from "@/db/schema";
import { db } from "@/db";
import { eq, sql } from "drizzle-orm";
import { DateTime, WeekdayNumbers } from "luxon";

function getEventDate(
  dayOffset: number,
  timeInMinutes: number,
  nowDateTime: DateTime
) {
  // Create a new DateTime in the same timezone as nowDateTime
  let eventDate = nowDateTime.set({
    weekday: (dayOffset + 1) as WeekdayNumbers,
    hour: Math.floor(timeInMinutes / 60),
    minute: timeInMinutes % 60,
    second: 0,
    millisecond: 0,
  });
  return eventDate;
}

export default async function VacentClassroomPage(props: {
  params: Promise<{ venue: string }>;
}) {
  const { venue: _venue } = await props.params;
  const venue = decodeURIComponent(_venue);

  const events = await db
    .select({
      for: {
        code: coursesTable.code,
        name: coursesTable.name,
        index: courseIndexTable.index,
      },
      weeks: courseIndexClassesTable.weeks,
      day: courseIndexClassesTable.day,
      from: sql<number>`${courseIndexClassesTable.timeFromHour} * 60 + ${courseIndexClassesTable.timeFromMinute}`,
      to: sql<number>`${courseIndexClassesTable.timeToHour} * 60 + ${courseIndexClassesTable.timeToMinute}`,
    })
    .from(courseIndexClassesTable)
    .innerJoin(
      courseIndexTable,
      eq(courseIndexClassesTable.indexId, courseIndexTable.id)
    )
    .innerJoin(coursesTable, eq(courseIndexTable.courseId, coursesTable.id))
    .where(eq(courseIndexClassesTable.venue, venue));

  const mappings = new Map<string, VacantClassroomEvent>();

  // Get current week's Monday in Singapore timezone
  const nowDateTime = DateTime.now().setZone("Asia/Singapore");
  const startOfWeek = nowDateTime.startOf("week");

  for (const event of events) {
    let from = getEventDate(event.day, event.from, startOfWeek);
    let to = getEventDate(event.day, event.to, startOfWeek);
    if (nowDateTime.weekday === 7) {
      from = from.plus({ days: 7 });
    }
    if (nowDateTime.weekday === 7) {
      to = to.plus({ days: 7 });
    }

    const key =
      `${event.for.code} ${event.for.name} ${event.for.index} ${event.day}-${from.hour}:${from.minute}-${to.hour}:${to.minute}` as const;
    if (mappings.has(key)) {
      continue;
    }
    const fromISO = from.toISO();
    const toISO = to.toISO();
    if (!fromISO || !toISO) {
      console.error("Failed to convert to ISO", from, to);
      continue;
    }
    mappings.set(key, {
      weeks: event.weeks,
      fromTime: { hour: Math.floor(event.from / 60), minute: event.from % 60 },
      toTime: { hour: Math.floor(event.to / 60), minute: event.to % 60 },
      from: fromISO,
      to: toISO,
      for: {
        code: event.for.code,
        name: event.for.name,
        index: event.for.index,
      },
    });
  }

  const eventsWithDates = Array.from(mappings.values());
  const startDate = nowDateTime.toFormat("yyyy-MM-dd");
  const endDate = nowDateTime.plus({ days: 7 }).toFormat("yyyy-MM-dd");

  return (
    <main className="flex flex-col w-full">
      <MainNavbar />
      <div className="flex flex-col items-center">
        <ScrollArea className="w-full flex flex-col lg:flex-row max-w-ui h-[calc(100svh-3.5rem)] md:h-[calc(100svh-4rem)]">
          {/* <div className="w-full flex flex-col h-[50rem] md:h-[64rem] lg:h-[80rem] xl:h-[96rem] min-w-5xl pl-4 pr-2 md:pl-8 md:pr-4 py-8 pb-20 gap-4"> */}
          <div className="w-full flex flex-col min-w-5xl pl-4 pr-2 md:pl-8 md:pr-4 py-8 pb-20 gap-4">
            <h1 className="text-2xl font-bold">{venue}</h1>
            <VacantClassroomCalendar
              events={eventsWithDates}
              startDate={startDate}
              endDate={endDate}
            />
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </main>
  );
}
