"use client";

import { ListFilter } from "lucide-react";
import { useRef } from "react";

import { isWeekSelected } from "@/components/calendar-view-week-selector";
import type { CalendarViewWeekSelector } from "@/components/timetable/timetable-view-week-selector";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Config } from "@/lib/config";
import { cn } from "@/lib/utils";

export type TimetableMobileView = "calendar" | "edit";

const selectedWeekClassName =
  "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:focus:bg-primary/90 data-[state=checked]:focus:text-primary-foreground data-[state=checked]:[&_svg]:text-primary-foreground";

export function TimetableMobileNav({
  activeView,
  onViewChange,
  weekSelector,
}: {
  activeView: TimetableMobileView;
  onViewChange: (view: TimetableMobileView) => void;
  weekSelector: CalendarViewWeekSelector;
}) {
  const lastSelectedWeek = useRef(0);
  const selectionModifiers = useRef({ altKey: false, shiftKey: false });
  const { selectedWeeksBitMask, setSelectedBitMask } = weekSelector;

  const updateWeekSelection = (index: number, shouldSelect: boolean) => {
    const { altKey, shiftKey } = selectionModifiers.current;
    selectionModifiers.current = { altKey: false, shiftKey: false };

    if (altKey) {
      setSelectedBitMask(1 << index);
      lastSelectedWeek.current = index;
      return;
    }

    if (shiftKey) {
      const start = Math.min(lastSelectedWeek.current, index);
      const end = Math.max(lastSelectedWeek.current, index);
      let nextSelectedWeeksBitMask = selectedWeeksBitMask;

      for (let rangeIndex = start; rangeIndex <= end; rangeIndex++) {
        nextSelectedWeeksBitMask = shouldSelect
          ? nextSelectedWeeksBitMask | (1 << rangeIndex)
          : nextSelectedWeeksBitMask & ~(1 << rangeIndex);
      }

      setSelectedBitMask(nextSelectedWeeksBitMask);
      return;
    }

    const weekBit = 1 << index;
    setSelectedBitMask(
      shouldSelect
        ? selectedWeeksBitMask | weekBit
        : selectedWeeksBitMask & ~weekBit
    );
    lastSelectedWeek.current = index;
  };

  return (
    <nav
      aria-label="Timetable views"
      className="pointer-events-none absolute inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-20 h-12 md:bottom-8 lg:hidden"
    >
      <div className="pointer-events-auto absolute left-1/2 flex h-12 w-[calc(100%-10rem)] max-w-52 -translate-x-1/2 items-center rounded-2xl border border-border bg-background/70 p-1 shadow-lg backdrop-blur-md dark:bg-neutral-800/30">
        <MobileViewButton
          active={activeView === "calendar"}
          label="Calendar"
          onClick={() => onViewChange("calendar")}
        />
        <MobileViewButton
          active={activeView === "edit"}
          label="Edit"
          onClick={() => onViewChange("edit")}
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Filter weeks"
            className="pointer-events-auto absolute right-4 size-12 rounded-2xl border border-border bg-background/70 shadow-lg backdrop-blur-md hover:bg-accent dark:bg-neutral-800/30 dark:hover:bg-neutral-800/60 md:right-8"
          >
            <ListFilter className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          side="top"
          sideOffset={10}
          className="max-h-[min(28rem,70svh)] w-48"
        >
          <DropdownMenuLabel>Filter by week</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {Array.from({ length: Config.lastWeek }, (_, index) => {
            const week = index + 1;
            const isSelected = isWeekSelected(selectedWeeksBitMask, week);
            const isPreviousSelected =
              index > 0 && isWeekSelected(selectedWeeksBitMask, week - 1);
            const isNextSelected =
              index < Config.lastWeek - 1 &&
              isWeekSelected(selectedWeeksBitMask, week + 1);

            return (
              <DropdownMenuCheckboxItem
                key={week}
                checked={isSelected}
                onPointerDown={(event) => {
                  selectionModifiers.current = {
                    altKey: event.altKey,
                    shiftKey: event.shiftKey,
                  };
                }}
                onKeyDown={(event) => {
                  selectionModifiers.current = {
                    altKey: event.altKey,
                    shiftKey: event.shiftKey,
                  };
                }}
                onCheckedChange={(checked) =>
                  updateWeekSelection(index, checked === true)
                }
                onDoubleClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setSelectedBitMask(1 << index);
                  lastSelectedWeek.current = index;
                }}
                onSelect={(event) => event.preventDefault()}
                className={cn(selectedWeekClassName, {
                  "rounded-t-none": isSelected && isPreviousSelected,
                  "rounded-b-none": isSelected && isNextSelected,
                })}
              >
                Week {week}
              </DropdownMenuCheckboxItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}

function MobileViewButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "ghost"}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "h-10 flex-1 rounded-xl px-3",
        !active && "text-muted-foreground"
      )}
    >
      {label}
    </Button>
  );
}
