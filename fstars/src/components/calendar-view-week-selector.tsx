"use client";

import { Button } from "./ui/button";
import { Config } from "@/lib/config";
import { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import { getAcadWeek, getNow } from "@/lib/acad";

export type CalendarViewWeekSelector = {
  selectedWeeksBitMask: number;
  setSelectedBitMask: (selectedBitMask: number) => void;
};

export function isWeekSelected(mask: number, week: number) {
  return (mask & (1 << (week - 1))) > 0;
}

export const ALL_WEEKS = (1 << Config.lastWeek) - 1;

export function getInitialSelectedWeeksBitMask() {
  const currentDateTime = getNow();
  const acadWeek = getAcadWeek(currentDateTime);
  if (!acadWeek || !acadWeek.week) {
    return ALL_WEEKS;
  }
  return 1 << (acadWeek.week - 1);
}

export function CalendarViewWeeksRow({
  maxWeeks,
  weekSelector,
  className,
}: {
  maxWeeks: number;
  weekSelector: CalendarViewWeekSelector;
  className?: string;
}) {
  const lastSelectedWeek = useRef(0);
  const { selectedWeeksBitMask, setSelectedBitMask } = weekSelector;

  const parentRef = useRef<HTMLDivElement>(null);
  const haveInitialized = useRef(false);
  useEffect(() => {
    if (!parentRef.current) {
      return;
    }
    if (haveInitialized.current) {
      return;
    }
    haveInitialized.current = true;
    const parent = parentRef.current;
    const children = parent.children;

    for (let i = 0; i < children.length; i++) {
      // Check if i is selected.
      if (isWeekSelected(selectedWeeksBitMask, i + 1)) {
        // Scroll to the child.
        children[i].scrollIntoView({ behavior: "instant" });
        break;
      }
    }
  }, [selectedWeeksBitMask, haveInitialized.current]);

  return (
    <ScrollArea className={className}>
      <div className="flex flex-row items-center pointer-events-auto">
        <div className="flex flex-row items-center" ref={parentRef}>
          {new Array(maxWeeks).fill(0).map((_, i) => {
            const week = i + 1;
            const isSelected = isWeekSelected(selectedWeeksBitMask, week);
            const isPreviousSelected =
              i > 0 && isWeekSelected(selectedWeeksBitMask, week - 1);
            const isNextSelected =
              i < Config.lastWeek - 1 &&
              isWeekSelected(selectedWeeksBitMask, week + 1);

            let shouldFlattenLeft = i !== 0 && isPreviousSelected && isSelected;
            let shouldFlattenRight =
              i !== maxWeeks - 1 && isNextSelected && isSelected;

            return (
              <Button
                key={i}
                className={cn(
                  "w-8 h-8 p-0 hover:ring-4 hover:ring-secondary/50 focus-visible:ring-4 focus-visible:ring-secondary/50",
                  {
                    "hover:ring-transparent focus-visible:ring-transparent":
                      isSelected,
                    "rounded-l-none": shouldFlattenLeft,
                    "rounded-r-none": shouldFlattenRight,
                  }
                )}
                onDoubleClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const newSelectedBitMask = 1 << i;
                  setSelectedBitMask(newSelectedBitMask);
                  lastSelectedWeek.current = i;
                }}
                onClick={(e) => {
                  let newSelectedBitMask = selectedWeeksBitMask ^ (1 << i);
                  if (e.altKey) {
                    newSelectedBitMask = 1 << i;
                    setSelectedBitMask(newSelectedBitMask);
                    lastSelectedWeek.current = i;
                    return;
                  }
                  if (e.shiftKey) {
                    const shouldToggleOn = (newSelectedBitMask & (1 << i)) > 0;
                    const start = Math.min(lastSelectedWeek.current, i);
                    const end = Math.max(lastSelectedWeek.current, i);
                    newSelectedBitMask = selectedWeeksBitMask;
                    for (let j = start; j <= end; j++) {
                      if (shouldToggleOn) {
                        newSelectedBitMask = newSelectedBitMask | (1 << j);
                      } else {
                        newSelectedBitMask = newSelectedBitMask & ~(1 << j);
                      }
                    }
                    setSelectedBitMask(newSelectedBitMask);
                    return;
                  }
                  setSelectedBitMask(newSelectedBitMask);
                  lastSelectedWeek.current = i;
                }}
                variant={isSelected ? "default" : "ghost"}
              >
                {i + 1}
              </Button>
            );
          })}
        </div>
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

export function CalendarViewWeekSelectorView({
  className,
  weekSelector,
}: {
  weekSelector: CalendarViewWeekSelector;
  className?: string;
}) {
  const selectAll = useCallback(() => {
    weekSelector.setSelectedBitMask(ALL_WEEKS);
  }, [weekSelector]);
  return (
    <div
      className={cn(
        "dark:bg-neutral-800/30 backdrop-blur-md border border-border rounded-2xl w-fit h-12 md:h-14 z-10 flex flex-row items-center px-2 md:px-4 pointer-events-none",
        className
      )}
    >
      <p className="text-sm text-muted-foreground pointer-events-none">
        <span className="lg:hidden">Wk</span>
        <span className="hidden lg:inline">Week</span>
      </p>
      <div className="mx-2 md:mx-4 w-[1px] h-full bg-border" />
      <div className="flex flex-row items-center pointer-events-auto">
        <CalendarViewWeeksRow
          maxWeeks={Config.lastWeek}
          weekSelector={weekSelector}
          className="w-full max-w-24 md:max-w-40 lg:max-w-72 xl:max-w-none"
        />
      </div>
      <div className="mx-2 md:mx-4 w-[1px] h-full bg-border" />
      <div className="flex flex-row items-center pointer-events-auto">
        <Button variant="outline" size="sm" onClick={selectAll}>
          All
        </Button>
      </div>
    </div>
  );
}
