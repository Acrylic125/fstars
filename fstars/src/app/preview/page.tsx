import { MainNavbar } from "@/components/nav/main-navbar";
import { TimetableView } from "@/components/timetable/timetable-view";
import {
  TimetableCoursesPanel,
  TimetableHeader,
} from "@/components/timetable/timetable-course-panel";
import { TimetableModal } from "@/components/timetable/timetable-modal";
import { TimetableGeneratorPanel } from "@/components/timetable/timetable-generator-panel";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { TimetableViewWeekSelector } from "@/components/timetable/timetable-view-week-selector";

export default async function Home(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  return (
    <main className="flex flex-col w-full">
      <MainNavbar />
      <div className="flex flex-col items-center">
        <div className="w-full flex flex-row max-w-ui">
          <ScrollArea className="relative w-full flex flex-col h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] overflow-x-auto">
            <div className="w-full flex flex-col h-[50rem] md:h-[64rem] lg:h-[80rem] xl:h-[96rem] min-w-5xl pl-4 pr-2 md:pl-8 md:pr-4 py-8 gap-4">
              <TimetableHeader id={id} />
              <TimetableView id={id} />
              <div className="w-full h-20 md:h-24 lg:h-28" />
            </div>
            <ScrollBar orientation="horizontal" />
            <TimetableViewWeekSelector className="absolute bottom-4 md:bottom-8 lg:bottom-12 left-1/2 -translate-x-1/2" />
          </ScrollArea>
          <ScrollArea className="w-md md:w-lg lg:w-xl relative group flex flex-col h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)]">
            {/* <TimetableExpandSideButton className="absolute top-4 -left-12" /> */}
            <div className="flex flex-col gap-2 md:gap-4 items-center py-8 pl-2 pr-4 md:pl-4 md:pr-8">
              <TimetableCoursesPanel id={id} />
              <TimetableGeneratorPanel timetableId={id} />
            </div>
          </ScrollArea>
        </div>
      </div>
      <TimetableModal />
    </main>
  );
}
