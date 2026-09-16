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
import { CalendarViewWeekSelectorView } from "@/components/calendar-view-week-selector";
import { Suspense, use, useState, useSyncExternalStore } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTimetableViewWeekSelector } from "@/components/timetable/timetable-view-week-selector";
import { useShallow } from "zustand/react/shallow";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TimetableMobileNav,
  type TimetableMobileView,
} from "@/components/timetable/timetable-mobile-nav";

const subscribeToHydration = () => () => {};

function useIsHydrated() {
  return useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false
  );
}

function TimetableViewWeekSelector() {
  const weekSelector = useTimetableViewWeekSelector(
    useShallow((state) => ({
      setSelectedBitMask: state.setSelectedBitMask,
      selectedWeeksBitMask: state.selectedWeeksBitMask,
    }))
  );

  return (
    <CalendarViewWeekSelectorView
      className="absolute bottom-4 md:bottom-8 lg:bottom-12 left-1/2 -translate-x-1/2"
      weekSelector={weekSelector}
    />
  );
}

function TimetableContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [isSidebarClosed, setSidebarClosed] = useState(false);
  const [mobileView, setMobileView] =
    useState<TimetableMobileView>("calendar");
  const weekSelector = useTimetableViewWeekSelector(
    useShallow((state) => ({
      setSelectedBitMask: state.setSelectedBitMask,
      selectedWeeksBitMask: state.selectedWeeksBitMask,
    }))
  );
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full flex flex-col lg:flex-row max-w-ui h-[calc(100svh-3.5rem)] md:h-[calc(100svh-4rem)] lg:h-fit">
        <ScrollArea
          className={cn(
            "relative h-full w-full flex-col overflow-x-auto lg:flex lg:h-[calc(100svh-4rem)]",
            mobileView === "calendar" ? "flex" : "hidden"
          )}
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
          <div className="hidden lg:block">
            <TimetableViewWeekSelector />
          </div>
        </ScrollArea>
        <ScrollArea
          className={cn(
            "relative h-full w-full flex-col lg:flex lg:h-[calc(100svh-4rem)] lg:border-0",
            mobileView === "edit" ? "flex" : "hidden",
            {
              "lg:w-xl": !isSidebarClosed,
              "lg:w-0": isSidebarClosed,
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
        <TimetableMobileNav
          activeView={mobileView}
          onViewChange={setMobileView}
          weekSelector={weekSelector}
        />
      </div>
    </div>
  );
}

function TimetableSkeleton() {
  return (
    <div className="flex flex-col items-center">
      <div className="w-full flex flex-col lg:flex-row max-w-ui h-[calc(100svh-3.5rem)] md:h-[calc(100svh-4rem)]">
        <div className="w-full p-4 md:p-8">
          <Skeleton className="h-full min-h-96 w-full" />
        </div>
        <div className="w-full lg:w-xl p-4 md:p-8">
          <Skeleton className="h-full min-h-80 w-full" />
        </div>
      </div>
    </div>
  );
}

export default function Home(props: { params: Promise<{ id: string }> }) {
  const isHydrated = useIsHydrated();

  return (
    <main className="flex flex-col w-full">
      <MainNavbar />
      {isHydrated ? (
        <Suspense fallback={<TimetableSkeleton />}>
          <TimetableContent params={props.params} />
        </Suspense>
      ) : (
        <TimetableSkeleton />
      )}
      <TimetableModal />
    </main>
  );
}
