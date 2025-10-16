import {
  TimetableCoursesPanel,
  TimetableHeader,
} from "@/components/timetable/timetable-course-panel";
import { TimetableModal } from "@/components/timetable/timetable-modal";
import { TimetableGeneratorPanel } from "@/components/timetable/timetable-generator-panel";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { TimetableViewWeekSelector } from "@/components/timetable/timetable-view-week-selector";
import { MainNavbar } from "@/components/nav/main-navbar";
import { VacantClassroomCalendar } from "@/components/vacant-classrooms/vacant-classroom-calendar";
import {
  courseIndexClassesTable,
  courseIndexTable,
  coursesTable,
} from "@/db/schema";
import { db } from "@/db";
import { eq, sql } from "drizzle-orm";

function getEventDate(dayOffset: number, timeInMinutes: number) {
  // Start of the week is Monday
  const now = new Date();
  const startOfWeek = new Date(now);
  //   startOfWeek.setDate(dayOffset);
  startOfWeek.setDate(now.getDate() - now.getDay() + dayOffset + 1);
  startOfWeek.setHours(
    Math.floor(timeInMinutes / 60),
    timeInMinutes % 60,
    0,
    0
  );
  return startOfWeek;
}

export default async function VacentClassroomPage(props: {
  params: Promise<{ venue: string }>;
}) {
  const { venue: _venue } = await props.params;
  const venue = decodeURIComponent(_venue);

  const events = await db
    .select({
      for: coursesTable.name,
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

  const mappings = new Map<
    string,
    {
      for: string;
      day: string;
      from: Date;
      to: Date;
    }
  >();

  for (const event of events) {
    const from = getEventDate(event.day, event.from);
    const to = getEventDate(event.day, event.to);
    const key =
      `${event.for} ${event.day}-${from.getHours()}:${from.getMinutes()}-${to.getHours()}:${to.getMinutes()}` as const;
    if (mappings.has(key)) {
      continue;
    }
    mappings.set(key, {
      day: event.day.toString(),
      from,
      to,
      for: event.for,
    });
  }

  const eventsWithDates = Array.from(mappings.values());

  return (
    <main className="flex flex-col w-full">
      <MainNavbar />
      <div className="flex flex-col items-center">
        <ScrollArea className="w-full flex flex-col lg:flex-row max-w-ui h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)]">
          <div className="w-full flex flex-col h-[50rem] md:h-[64rem] lg:h-[80rem] xl:h-[96rem] min-w-5xl pl-4 pr-2 md:pl-8 md:pr-4 py-8 gap-4">
            <VacantClassroomCalendar events={eventsWithDates} />
          </div>
        </ScrollArea>
      </div>
    </main>
  );
}
