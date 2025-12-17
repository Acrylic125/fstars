import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { MainNavbar } from "@/components/nav/main-navbar";
import {
  VacantClassroomCalendar,
  VacantClassroomEvent,
  VacantClassroomViewWeekSelector,
} from "@/components/vacant-classrooms/vacant-classroom-calendar";
import {
  courseIndexClassesTable,
  courseIndexTable,
  coursesTable,
  locationAltNamesTable,
  locationsTable,
} from "@/db/schema";
import { db } from "@/db";
import { and, eq, inArray, sql } from "drizzle-orm";
import { DateTime, WeekdayNumbers } from "luxon";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { translateBuilding } from "@/lib/acad";
import { Button } from "@/components/ui/button";
import {
  ExternalLinkIcon,
  MapIcon,
  Navigation,
  Navigation2,
} from "lucide-react";
import { Config } from "@/lib/config";

function getEventDate(
  dayOffset: number,
  timeInMinutes: number,
  startOfWeek: DateTime
) {
  // Create a new DateTime in the same timezone as nowDateTime
  // Note: Add 7 days cus luxon uses monday as the first day of the week.
  let eventDate = startOfWeek.plus({ days: 7 }).set({
    weekday: dayOffset === 0 ? 7 : (dayOffset as WeekdayNumbers),
    hour: Math.floor(timeInMinutes / 60),
    minute: timeInMinutes % 60,
    second: 0,
    millisecond: 0,
  });
  return eventDate;
}

async function ClassroomHeaderLoader(props: { venue: string }) {
  const locationsRows = await db
    .select({
      venue: locationAltNamesTable.altName,
      name: locationsTable.name,
      floorName: locationsTable.floorName,
      area: locationsTable.building,
      location: locationsTable.mapIndoorsRoomId,
    })
    .from(locationAltNamesTable)
    .innerJoin(
      locationsTable,
      eq(locationAltNamesTable.locationId, locationsTable.id)
    )
    .where(eq(locationAltNamesTable.altName, props.venue))
    .limit(1);

  if (locationsRows.length === 0) {
    return (
      <div className="h-16 flex flex-col gap-1">
        <h1 className="text-2xl font-bold">{props.venue}</h1>
        <p className="text-base text-muted-foreground">{props.venue}</p>
      </div>
    );
  }

  const location = locationsRows[0];

  const components = [props.venue];
  if (location.area && location.area !== "") {
    components.push(` @ ${translateBuilding(location.area)}`);
  }
  if (location.floorName && location.floorName !== "") {
    components.push(`, Floor ${location.floorName}`);
  }
  return (
    <div className="w-full flex flex-col xl:flex-row justify-between gap-4 xl:items-center">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">{location.name}</h1>
        <p className="text-base text-muted-foreground">{components.join("")}</p>
      </div>
      <div className="flex flex-row gap-2 items-center">
        <Button
          variant="outline"
          className="flex flex-row gap-2 items-center"
          asChild
        >
          <a
            href={`https://maps.ntu.edu.sg/#/ntu/d386ffa80e4e46f286d17f08/poi/details/${location.location}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            NTU Map <ExternalLinkIcon className="size-4" />
          </a>
        </Button>
      </div>
    </div>
  );
}

export default async function VacentClassroomPage(props: {
  params: Promise<{ venue: string }>;
  searchParams: Promise<{ ay?: string; sem?: string }>;
}) {
  const { venue: _venue } = await props.params;
  const {
    ay = Config.currentAcademicYear.ay,
    sem = `${Config.currentAcademicYear.semester}`,
  } = await props.searchParams;
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
    .where(
      and(
        eq(courseIndexClassesTable.venue, venue),
        eq(coursesTable.ay, ay),
        eq(coursesTable.semester, sem)
      )
    );

  const mappings = new Map<string, VacantClassroomEvent>();

  // Get current week's Monday in Singapore timezone
  const nowDateTime = DateTime.now().setZone("Asia/Singapore");
  const startOfWeek = nowDateTime.startOf("week", { useLocaleWeeks: true });

  for (const event of events) {
    let from = getEventDate(event.day, event.from, startOfWeek);
    let to = getEventDate(event.day, event.to, startOfWeek);

    const key =
      `${event.for.code} ${event.for.name} ${event.day}-${from.hour}:${from.minute}-${to.hour}:${to.minute}` as const;
    if (mappings.has(key)) {
      mappings.get(key)?.for.indexes.push(event.for.index);
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
        indexes: [event.for.index],
      },
    });
  }

  const eventsWithDates = Array.from(mappings.values());
  const startDate = startOfWeek.toFormat("yyyy-MM-dd");
  const endDate = startOfWeek.plus({ days: 7 }).toFormat("yyyy-MM-dd");

  return (
    <main className="flex flex-col w-full">
      <MainNavbar />
      <div className="flex flex-col items-center">
        <ScrollArea className="w-full flex flex-col lg:flex-row max-w-ui h-[calc(100svh-3.5rem)] md:h-[calc(100svh-4rem)]">
          {/* <div className="w-full flex flex-col h-[50rem] md:h-[64rem] lg:h-[80rem] xl:h-[96rem] min-w-5xl pl-4 pr-2 md:pl-8 md:pr-4 py-8 pb-20 gap-4"> */}
          <div className="w-full flex flex-col min-w-5xl pl-4 pr-2 md:pl-8 md:pr-4 py-8 pb-20 gap-4">
            <Suspense fallback={<Skeleton className="w-full h-48" />}>
              <ClassroomHeaderLoader venue={venue} />
            </Suspense>
            <VacantClassroomViewWeekSelector />
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
