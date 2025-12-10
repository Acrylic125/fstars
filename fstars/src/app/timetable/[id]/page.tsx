"use client";
import { MainNavbar } from "@/components/nav/main-navbar";
import { TimetableSelfView } from "@/components/timetable/timetable-view";
import {
  TimetableCoursesPanel,
  TimetableHeader,
} from "@/components/timetable/timetable-course-panel";
import { TimetableModal } from "@/components/timetable/timetable-modal";
import { TimetableGeneratorPanel } from "@/components/timetable/timetable-generator-panel";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { TimetableViewWeekSelector } from "@/components/timetable/timetable-view-week-selector";
import { Suspense, use, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Home(props: { params: Promise<{ id: string }> }) {
  // export default function Home(props: { params: { id: string } }) {
  const { id } = use(props.params);

  const [isSidebarClosed, setSidebarClosed] = useState(false);
  return (
    <main className="flex flex-col w-full">
      <MainNavbar />
      <div className="flex flex-col items-center">
        <div className="w-full flex flex-col lg:flex-row max-w-ui h-[calc(100svh-3.5rem)] md:h-[calc(100svh-4rem)] lg:h-fit">
          <ScrollArea
            className={cn("relative w-full flex flex-col overflow-x-auto", {
              "h-1/2 lg:h-[calc(100svh-4rem)]": !isSidebarClosed,
              "h-full lg:h-[calc(100svh-4rem)]": isSidebarClosed,
            })}
          >
            {/* <div className="w-full flex flex-col h-[50rem] md:h-[64rem] lg:h-[80rem] xl:h-[96rem] min-w-5xl pl-4 pr-2 md:pl-8 md:pr-4 py-8 gap-4"> */}
            <div className="w-full flex flex-col min-w-5xl pl-4 pr-2 md:pl-8 md:pr-4 py-8 gap-4">
              <TimetableHeader id={id} />
              <Suspense>
                <TimetableSelfView id={id} />
              </Suspense>
              <div className="w-full h-20 md:h-24 lg:h-28" />
            </div>
            <ScrollBar orientation="horizontal" />
            <div className="absolute top-0 right-0 hidden lg:flex z-10">
              <Button
                variant="secondary"
                onClick={() => setSidebarClosed(!isSidebarClosed)}
              >
                {isSidebarClosed ? <ChevronLeft /> : <ChevronRight />}
              </Button>
            </div>
            <div className="absolute bottom-4 md:bottom-8 lg:bottom-12 right-8 lg:hidden z-10">
              <Button
                variant="secondary"
                onClick={() => setSidebarClosed(!isSidebarClosed)}
              >
                {isSidebarClosed ? <ChevronUp /> : <ChevronDown />}
              </Button>
            </div>
            <TimetableViewWeekSelector className="absolute bottom-4 md:bottom-8 lg:bottom-12 left-1/2 -translate-x-1/2" />
          </ScrollArea>
          <ScrollArea
            className={cn(
              "w-full lg:w-xl relative group flex flex-col border-t border-border lg:border-0",
              {
                "h-1/2 lg:h-[calc(100svh-4rem)] lg:w-xl": !isSidebarClosed,
                "h-0 lg:h-[calc(100svh-4rem)] lg:w-0": isSidebarClosed,
              }
            )}
          >
            <div className="flex flex-col gap-2 md:gap-4 items-center p-2 pb-32 lg:py-8 lg:pl-4 lg:pr-8">
              <Suspense>
                <TimetableCoursesPanel id={id} />
                <TimetableGeneratorPanel timetableId={id} />
              </Suspense>
            </div>
          </ScrollArea>
        </div>
      </div>
      <TimetableModal />
    </main>
  );
}
