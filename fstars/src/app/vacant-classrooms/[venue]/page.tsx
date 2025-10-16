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
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const date = new Date(startOfWeek);
  date.setDate(date.getDate() + dayOffset);

  const hours = Math.floor(timeInMinutes / 60);
  const minutes = timeInMinutes % 60;
  date.setHours(hours, minutes, 0, 0);
  return date;
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

  const eventsWithDates = events.map((event) => ({
    ...event,
    from: getEventDate(event.day, event.from),
    to: getEventDate(event.day, event.to),
  }));

  console.log(venue);
  console.log(eventsWithDates);

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
