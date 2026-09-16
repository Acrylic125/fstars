"use client";

import { CalendarDays, ListFilter, PencilLine } from "lucide-react";
import { useRef, type ReactNode } from "react";

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
      className="absolute inset-x-0 bottom-0 z-20 flex min-h-16 items-center border-t border-border bg-background/95 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgb(0_0_0/0.06)] backdrop-blur-md lg:hidden"
    >
      <div className="flex flex-1 items-center gap-1">
        <MobileViewButton
          active={activeView === "calendar"}
          icon={<CalendarDays />}
          label="Calendar"
          onClick={() => onViewChange("calendar")}
        />
        <MobileViewButton
          active={activeView === "edit"}
          icon={<PencilLine />}
          label="Edit"
          onClick={() => onViewChange("edit")}
        />
      </div>

      <div className="mx-2 h-8 w-px bg-border" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-11 min-w-20 flex-col gap-0.5 px-3">
            <ListFilter className="size-4" />
            <span className="text-xs leading-none">Filter</span>
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
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "h-11 flex-1 flex-col gap-0.5 px-2 text-muted-foreground",
        active && "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
      )}
    >
      {icon}
      <span className="text-xs leading-none">{label}</span>
    </Button>
  );
}
