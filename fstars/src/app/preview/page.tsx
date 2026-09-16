"use client";
import { MainNavbar } from "@/components/nav/main-navbar";
import { TimetableModal } from "@/components/timetable/timetable-modal";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { TimetableViewWeekSelector } from "@/components/calendar-view-week-selector";
import {
  TimetableCoursesSharedPanel,
  TimetableSharedView,
} from "@/components/timetable/preview-timetable";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import {
  TimetableMobileNav,
  type TimetableMobileView,
} from "@/components/timetable/timetable-mobile-nav";
import { usePreviewViewWeekSelector } from "@/components/timetable/timetable-view-week-selector";
import { useShallow } from "zustand/react/shallow";

const TimetableViewWeekSelectorDynamic = dynamic(
  () => Promise.resolve(TimetableViewWeekSelector),
  {
    ssr: false,
  }
);

export default function Home() {
  const [sidebarClosed, setSidebarClosed] = useState(false);
  const [mobileView, setMobileView] =
    useState<TimetableMobileView>("calendar");
  const weekSelector = usePreviewViewWeekSelector(
    useShallow((state) => ({
      selectedWeeksBitMask: state.selectedWeeksBitMask,
      setSelectedBitMask: state.setSelectedBitMask,
    }))
  );

  return (
    <main className="flex flex-col w-full">
      <MainNavbar />
      <div className="flex flex-col items-center">
        <div className="relative w-full flex flex-col lg:flex-row max-w-ui h-[calc(100svh-3.5rem)] md:h-[calc(100svh-4rem)] lg:h-fit">
          <ScrollArea
            className={cn(
              "relative h-full w-full flex-col overflow-x-auto lg:flex lg:h-[calc(100svh-4rem)]",
              mobileView === "calendar" ? "flex" : "hidden"
            )}
          >
            <div className="pl-4 pr-2 md:pl-8 md:pr-4 py-1 text-xs md:text-sm bg-sky-100 dark:bg-sky-800">
              You are on a shared timetable. To use it, import it.
            </div>
            <div className="w-full flex flex-col min-w-5xl pl-4 pr-2 md:pl-8 md:pr-4 py-8 gap-4">
              <Suspense>
                <TimetableSharedView />
              </Suspense>
              <div className="w-full h-20 md:h-24 lg:h-28" />
            </div>
            <ScrollBar orientation="horizontal" />
            <div className="hidden lg:block">
              <TimetableViewWeekSelectorDynamic />
            </div>
            <div className="absolute top-0 right-0 hidden lg:flex z-10">
              <Button
                variant="secondary"
                onClick={() => setSidebarClosed(!sidebarClosed)}
              >
                {sidebarClosed ? <ChevronLeft /> : <ChevronRight />}
              </Button>
            </div>
          </ScrollArea>
          <ScrollArea
            className={cn(
              "relative h-full w-full flex-col lg:flex lg:h-[calc(100svh-4rem)] lg:border-0",
              mobileView === "edit" ? "flex" : "hidden",
              {
                "lg:w-xl": !sidebarClosed,
                "lg:w-0": sidebarClosed,
              }
            )}
          >
            <div className="flex flex-col gap-2 md:gap-4 items-center p-2 pb-32 lg:py-8 lg:pl-4 lg:pr-8">
              <Suspense>
                <TimetableCoursesSharedPanel />
              </Suspense>
            </div>
          </ScrollArea>
          <TimetableMobileNav
            activeView={mobileView}
            onViewChange={setMobileView}
            weekSelector={weekSelector}
          />
        </div>
      </div>
      <TimetableModal />
    </main>
  );
}
