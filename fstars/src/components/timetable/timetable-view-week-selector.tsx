"use client";

import { create } from "zustand";
import { Button } from "../ui/button";
import { Config } from "@/lib/config";
import { useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { cn } from "@/lib/utils";

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

export function TimetableViewWeekSelector() {
  const lastSelectedWeek = useRef(0);
  const { selectedWeeksBitMask, setSelectedBitMask } =
    useTimetableViewWeekSelector(
      useShallow((state) => ({
        selectedWeeksBitMask: state.selectedWeeksBitMask,
        setSelectedBitMask: state.setSelectedBitMask,
      }))
    );

  return (
    <div className="absolute bottom-8 md:bottom-12 lg:bottom-16 left-1/2 -translate-x-1/2 dark:bg-neutral-800/30 backdrop-blur-md border border-border rounded-2xl w-fit h-14 z-10 flex flex-row items-center px-4 pointer-events-none">
      <p className="text-sm text-muted-foreground pointer-events-none">Week</p>
      <div className="ml-4 w-[1px] h-full bg-border" />
      <div className="flex flex-row items-center pointer-events-auto">
        {new Array(Config.lastWeek).fill(0).map((_, i) => {
          const isSelected = (selectedWeeksBitMask & (1 << i)) > 0;
          const isPreviousSelected =
            i > 0 && (selectedWeeksBitMask & (1 << (i - 1))) > 0;
          const isNextSelected =
            i < Config.lastWeek - 1 &&
            (selectedWeeksBitMask & (1 << (i + 1))) > 0;
          return (
            <Button
              key={i}
              className={cn(
                "w-8 h-8 p-0 hover:ring-4 hover:ring-secondary/50 focus-visible:ring-4 focus-visible:ring-secondary/50",
                {
                  "hover:ring-transparent focus-visible:ring-transparent":
                    isSelected,
                  "rounded-r-none": isNextSelected && isSelected,
                  "rounded-l-none": isPreviousSelected && isSelected,
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
  );
}
