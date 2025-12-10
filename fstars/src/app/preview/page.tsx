"use client";
import { MainNavbar } from "@/components/nav/main-navbar";
import { TimetableModal } from "@/components/timetable/timetable-modal";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { TimetableViewWeekSelector } from "@/components/timetable/timetable-view-week-selector";
import {
  TimetableCoursesSharedPanel,
  TimetableSharedView,
} from "@/components/timetable/preview-timetable";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

// export default async function Home(props: { params: Promise<{}> }) {
export default function Home(props: { params: Promise<{}> }) {
  const [sidebarClosed, setSidebarClosed] = useState(false);
  return (
    <main className="flex flex-col w-full">
      <MainNavbar />
      <div className="flex flex-col items-center">
        <div className="w-full flex flex-col lg:flex-row max-w-ui h-[calc(100svh-3.5rem)] md:h-[calc(100svh-4rem)] lg:h-fit">
          <ScrollArea
            className={cn("relative w-full flex flex-col overflow-x-auto", {
              "h-1/2 lg:h-[calc(100svh-4rem)]": !sidebarClosed,
              "h-full lg:h-[calc(100svh-4rem)]": sidebarClosed,
            })}
          >
            <div className="pl-4 pr-2 md:pl-8 md:pr-4 py-1 text-xs md:text-sm bg-sky-100 dark:bg-sky-800">
              You are on a shared timetable. To use it, import it.
            </div>
            <div className="w-full flex flex-col min-w-5xl pl-4 pr-2 md:pl-8 md:pr-4 py-8 gap-4">
              <TimetableSharedView />
              <div className="w-full h-20 md:h-24 lg:h-28" />
            </div>
            <ScrollBar orientation="horizontal" />
            <TimetableViewWeekSelector className="absolute bottom-4 md:bottom-8 lg:bottom-12 left-1/2 -translate-x-1/2" />
            <div className="absolute top-0 right-0 hidden lg:flex z-10">
              <Button
                variant="secondary"
                onClick={() => setSidebarClosed(!sidebarClosed)}
              >
                {sidebarClosed ? <ChevronLeft /> : <ChevronRight />}
              </Button>
            </div>
            <div className="absolute bottom-4 md:bottom-8 lg:bottom-12 right-8 lg:hidden z-10">
              <Button
                variant="secondary"
                onClick={() => setSidebarClosed(!sidebarClosed)}
              >
                {sidebarClosed ? <ChevronUp /> : <ChevronDown />}
              </Button>
            </div>
          </ScrollArea>
          <ScrollArea
            className={cn(
              "w-full relative group flex flex-col border-t border-border lg:border-0",
              {
                "h-1/2 lg:h-[calc(100svh-4rem)] lg:w-xl": !sidebarClosed,
                "h-0 lg:h-[calc(100svh-4rem)] lg:w-0": sidebarClosed,
              }
            )}
          >
            <div className="flex flex-col gap-2 md:gap-4 items-center p-2 pb-32 lg:py-8 lg:pl-4 lg:pr-8">
              <TimetableCoursesSharedPanel />
            </div>
          </ScrollArea>
        </div>
      </div>
      <TimetableModal />
    </main>
  );
}
