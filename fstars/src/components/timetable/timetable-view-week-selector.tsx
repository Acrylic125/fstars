"use client";

import { create } from "zustand";
import { Button } from "../ui/button";
import { Config } from "@/lib/config";
import { useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";

type TimetableViewWeekSelector = {
  selectedWeeksBitMask: number;
  setSelectedBitMask: (selectedBitMask: number) => void;
};

export const useTimetableViewWeekSelector = create<TimetableViewWeekSelector>(
  (set, get) => ({
    selectedWeeksBitMask: 16383,
    setSelectedBitMask: (selectedBitMask) => {
      return set({
        selectedWeeksBitMask: selectedBitMask,
      });
    },
  })
);

export function TimetableViewWeeksRow({
  maxWeeks,
  className,
}: {
  maxWeeks: number;
  className?: string;
}) {
  const lastSelectedWeek = useRef(0);
  const { selectedWeeksBitMask, setSelectedBitMask } =
    useTimetableViewWeekSelector(
      useShallow((state) => ({
        selectedWeeksBitMask: state.selectedWeeksBitMask,
        setSelectedBitMask: state.setSelectedBitMask,
      }))
    );

  return (
    <ScrollArea className={className}>
      <div className="flex flex-row items-center pointer-events-auto">
        <div className="flex flex-row items-center">
          {new Array(maxWeeks).fill(0).map((_, i) => {
            const isSelected = (selectedWeeksBitMask & (1 << i)) > 0;
            const isPreviousSelected =
              i > 0 && (selectedWeeksBitMask & (1 << (i - 1))) > 0;
            const isNextSelected =
              i < Config.lastWeek - 1 &&
              (selectedWeeksBitMask & (1 << (i + 1))) > 0;

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

export function TimetableViewWeekSelector({
  className,
}: {
  className?: string;
}) {
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
        <TimetableViewWeeksRow
          maxWeeks={Config.lastWeek}
          className="w-full max-w-24 md:max-w-40 lg:max-w-72 xl:max-w-none"
        />
      </div>
      <div className="mx-2 md:mx-4 w-[1px] h-full bg-border" />
      <div className="flex flex-row items-center pointer-events-auto">
        <Button variant="outline" size="sm">
          All
        </Button>
      </div>
    </div>
  );
}
