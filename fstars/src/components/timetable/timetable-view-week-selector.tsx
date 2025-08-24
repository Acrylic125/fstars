"use client";

import { create } from "zustand";
import { Button } from "../ui/button";
import { Config } from "@/lib/config";
import { useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  numberOfWeeksPerGroup,
}: {
  maxWeeks: number;
  numberOfWeeksPerGroup: number;
}) {
  const lastSelectedWeek = useRef(0);
  const { selectedWeeksBitMask, setSelectedBitMask } =
    useTimetableViewWeekSelector(
      useShallow((state) => ({
        selectedWeeksBitMask: state.selectedWeeksBitMask,
        setSelectedBitMask: state.setSelectedBitMask,
      }))
    );
  const [showFromWeekGroup, setShowFromWeekGroup] = useState(0);
  const MAX_GROUPS = Math.ceil(maxWeeks / numberOfWeeksPerGroup);

  // let s = maxWeeks;
  const offset = showFromWeekGroup * numberOfWeeksPerGroup;
  const s = numberOfWeeksPerGroup; //Math.min(maxWeeks - offset, numberOfWeeksPerGroup);

  return (
    <div className="flex flex-row items-center pointer-events-auto">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowFromWeekGroup((prev) => prev - 1)}
        disabled={showFromWeekGroup === 0}
        className={cn({
          hidden: maxWeeks === numberOfWeeksPerGroup,
        })}
      >
        <ChevronLeft />
      </Button>
      <div className="flex flex-row items-center">
        {new Array(s).fill(0).map((_, _i) => {
          const i = _i + offset;
          if (i >= maxWeeks) {
            return <div key={i} className="w-8 h-8" />;
          }

          const isSelected = (selectedWeeksBitMask & (1 << i)) > 0;
          const isPreviousSelected =
            i > 0 && (selectedWeeksBitMask & (1 << (i - 1))) > 0;
          const isNextSelected =
            i < Config.lastWeek - 1 &&
            (selectedWeeksBitMask & (1 << (i + 1))) > 0;

          let shouldFlattenLeft = _i !== 0 && isPreviousSelected && isSelected;
          let shouldFlattenRight = _i !== s - 1 && isNextSelected && isSelected;

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

      {/* <div className="hidden lg:flex flex-row items-center">
        <TimetableViewWeeksRow maxWeeks={Config.lastWeek} />
      </div> */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() =>
          setShowFromWeekGroup((prev) => Math.min(prev + 1, MAX_GROUPS - 1))
        }
        disabled={showFromWeekGroup >= MAX_GROUPS - 1}
        className={cn({
          hidden: maxWeeks === numberOfWeeksPerGroup,
        })}
      >
        <ChevronRight />
      </Button>
    </div>
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
        "dark:bg-neutral-800/30 backdrop-blur-md border border-border rounded-2xl w-fit h-14 z-10 flex flex-row items-center px-4 pointer-events-none",
        className
      )}
    >
      <p className="text-sm text-muted-foreground pointer-events-none">
        <span className="lg:hidden">Wk</span>
        <span className="hidden lg:inline">Week</span>
      </p>
      <div className="ml-4 mr-4 w-[1px] h-full bg-border" />
      <div className="flex md:hidden flex-row items-center pointer-events-auto">
        <TimetableViewWeeksRow
          maxWeeks={Config.lastWeek}
          numberOfWeeksPerGroup={3}
        />
      </div>
      <div className="hidden md:flex lg:hidden flex-row items-center pointer-events-auto">
        <TimetableViewWeeksRow
          maxWeeks={Config.lastWeek}
          numberOfWeeksPerGroup={7}
        />
      </div>
      <div className="hidden lg:flex flex-row items-center pointer-events-auto">
        <TimetableViewWeeksRow
          maxWeeks={Config.lastWeek}
          numberOfWeeksPerGroup={Config.lastWeek}
        />
      </div>
    </div>
  );
}
