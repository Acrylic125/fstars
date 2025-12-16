"use client";
import { useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import "./fullcalendar.css";
import { useTimetableStore } from "./timetable-store";
import { useShallow } from "zustand/react/shallow";
import { trpc } from "@/server/client";
import { ColorScheme, getColorMapForCourses } from "./utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { isIntersectingDate } from "@/generator/utils";
import { clamp, cn, formatTime } from "@/lib/utils";
import { AlertTriangleIcon, ArrowDownRightIcon } from "lucide-react";
import { useViewport } from "../use-viewport";
import { AcadYear } from "@/lib/types";
import { useTimetableViewWeekSelector } from "./timetable-view-week-selector";

type FCEvent = {
  title: string;
  start: Date;
  end: Date;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
};

type ExtendedProps = {
  day: number;
  code: string;
  name: string;
  index: string;
  timeStr: string;
  entries: {
    type: string;
    venue: string;
    weeks: number[];
    location?: {
      venue: string;
      area: string | null;
      location: string | null;
      mapIndoorsId: string;
    };
  }[];
  isError: boolean;
};

function getEventDate(dayOffset: number, hour: number, minute: number) {
  const now = new Date();
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  const date = new Date(startOfWeek);
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date;
}

export function TimetableSelfView({ id }: { id: string }) {
  const { selectedWeeksBitMask } = useTimetableViewWeekSelector(
    useShallow((state) => ({
      selectedWeeksBitMask: state.selectedWeeksBitMask,
    }))
  );
  const timetableStore = useTimetableStore(
    useShallow((state) => {
      const timetable = state.timetables.get(id);
      if (!timetable) {
        return null;
      }

      const plan = timetable.plans.get(timetable.selectedPlanId);

      return {
        acadYear: timetable.acadYear,
        courses: plan?.courses ?? null,
      };
    })
  );
  const courseCodes = useMemo(() => {
    if (!timetableStore?.courses) {
      return [];
    }
    return Array.from(timetableStore.courses.entries()).map(
      ([courseCode, index]) => ({
        courseCode,
        index: index.index,
      })
    );
  }, [timetableStore?.courses]);

  if (!timetableStore) {
    return (
      <div className="w-full h-full flex flex-col lg:items-center lg:justify-center border border-border rounded-md p-4 lg:p-8">
        <h2 className="text-lg font-bold">Timetable not found {"):"}</h2>
        <p className="text-sm text-muted-foreground max-w-sm lg:text-center">
          Timetables are{" "}
          <span className="text-primary">stored on your browser</span>, you must
          access this page from the same device, on the same browser.
        </p>
      </div>
    );
  }

  return (
    <TimetableView
      courseCodes={courseCodes}
      acadYear={timetableStore.acadYear}
      selectedWeeksBitMask={selectedWeeksBitMask}
    />
  );
}

export function TimetableView({
  courseCodes,
  acadYear,
  selectedWeeksBitMask,
}: {
  courseCodes: { courseCode: string; index: string }[];
  acadYear: AcadYear;
  selectedWeeksBitMask: number;
}) {
  const colorScheme: ColorScheme = "default";

  const selectedCourseClasses = trpc.getCourseIndexClasses.useQuery(
    {
      courses: courseCodes ?? [],
      acadYear: acadYear,
    },
    {
      enabled: !!courseCodes,
    }
  );

  const colorMap = useMemo(() => {
    return getColorMapForCourses(
      courseCodes.map((c) => c.courseCode),
      colorScheme
    );
  }, [courseCodes, colorScheme]);

  const events = useMemo(() => {
    if (!selectedCourseClasses.data) {
      return [];
    }

    const aggregatedEventMap: Map<string, FCEvent & ExtendedProps> = new Map();
    const eventRefsInDay: string[][] = new Array(7);
    for (let i = 0; i < 7; i++) {
      eventRefsInDay[i] = [];
    }
    for (const c of selectedCourseClasses.data) {
      const groupKey = `${c.course.code}-${c.day}-${c.from.hour}:${c.from.minute}-${c.to.hour}${c.to.minute}`;
      const group = aggregatedEventMap.get(groupKey);
      if (!group) {
        const color = colorMap.get(c.course.code);
        if (!color) {
          console.error("Color not found for course", c.course.code);
          continue;
        }

        const entry = {
          type: c.type,
          venue: c.venue,
          weeks: c.weeks,
          location: c.location,
        };
        if (
          !entry.weeks.some((week) => {
            const weekIndex = week - 1;
            return (
              weekIndex < 0 || (selectedWeeksBitMask & (1 << weekIndex)) > 0
            );
          })
        ) {
          continue;
        }

        const event: FCEvent & ExtendedProps = {
          title: c.course.code,
          start: getEventDate(c.day, c.from.hour, c.from.minute),
          end: getEventDate(c.day, c.to.hour, c.to.minute),
          timeStr: `${formatTime(c.from.hour, c.from.minute)} - ${formatTime(c.to.hour, c.to.minute)}`,
          backgroundColor: color.backgroundColor,
          borderColor: color.backgroundColor,
          textColor: color.color,
          code: c.course.code,
          name: c.course.name,
          index: c.index,
          entries: [entry],
          isError: false,
          day: c.day,
        };
        aggregatedEventMap.set(groupKey, event);
        eventRefsInDay[c.day].push(groupKey);
        continue;
      }

      const entry = {
        type: c.type,
        venue: c.venue,
        weeks: c.weeks,
        location: c.location,
      };
      if (
        !entry.weeks.some((week) => {
          const weekIndex = week - 1;
          return weekIndex < 0 || (selectedWeeksBitMask & (1 << weekIndex)) > 0;
        })
      ) {
        continue;
      }
      group.entries.push(entry);
    }

    for (const events of eventRefsInDay) {
      if (events.length <= 0) {
        continue;
      }
      for (let i = 0; i < events.length; i++) {
        const eventRef = events[i];
        for (let j = i + 1; j < events.length; j++) {
          const otherEventRef = events[j];
          const event = aggregatedEventMap.get(eventRef);
          const otherEvent = aggregatedEventMap.get(otherEventRef);
          if (!event || !otherEvent) {
            console.error("Event not found", eventRef, otherEventRef);
            continue;
          }
          if (
            isIntersectingDate(
              {
                from: event.start,
                to: event.end,
              },
              {
                from: otherEvent.start,
                to: otherEvent.end,
              }
            )
          ) {
            const weeksInEvent = event.entries.reduce((acc, entry) => {
              return acc.concat(entry.weeks);
            }, [] as number[]);
            const weeksInOtherEvent = otherEvent.entries.reduce(
              (acc, entry) => {
                return acc.concat(entry.weeks);
              },
              [] as number[]
            );
            const hasWeeksInCommon = weeksInEvent.some((week) =>
              weeksInOtherEvent.includes(week)
            );
            if (hasWeeksInCommon) {
              event.isError = true;
              otherEvent.isError = true;
            }
          }
        }
      }
    }
    return Array.from(aggregatedEventMap.values());
  }, [selectedCourseClasses.data, courseCodes, selectedWeeksBitMask, colorMap]);

  const { height } = useViewport();
  const calendarHeight = useMemo(() => {
    return clamp(height - 240, 960, 1920);
  }, [height]);

  return (
    <FullCalendar
      plugins={[timeGridPlugin]}
      initialView="timeGridWeek"
      headerToolbar={false}
      expandRows={true}
      dragScroll={true}
      events={events}
      eventContent={(arg) => {
        // TODO: Annoying type casting.
        const event = arg.event.extendedProps as ExtendedProps;

        return (
          <Popover>
            <PopoverTrigger asChild>
              <div
                className={cn(
                  "relative flex flex-col justify-between w-full h-full px-1.5 py-0.5 rounded-xs cursor-pointer",
                  {
                    "bg-red-600 dark:bg-red-700 text-white fc-error":
                      event.isError,
                  }
                )}
              >
                <h3
                  className={cn("text-sm font-bold text-neutral-950", {
                    "text-white": event.isError,
                  })}
                >
                  {arg.event.extendedProps.code ?? "No Code"}
                </h3>
                <div className="flex flex-col flex-1">
                  {event.entries.map((entry, i) => {
                    return (
                      <div
                        className={cn("text-sm truncate text-neutral-600", {
                          "text-neutral-300": event.isError,
                        })}
                        key={i}
                      >
                        {entry.type} | {entry.venue} | {entry.weeks.join(", ")}
                      </div>
                    );
                  })}
                </div>
                <div
                  className={cn("text-xs text-neutral-500", {
                    "text-neutral-300": event.isError,
                  })}
                >
                  {event.timeStr}
                </div>
                <div
                  className={cn(
                    "absolute bottom-0 right-0 pb-1 pr-1 text-neutral-900",
                    {
                      "text-white": event.isError,
                    }
                  )}
                >
                  <ArrowDownRightIcon className="size-4" />
                </div>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-80 flex flex-col gap-2">
              <div
                className="w-8 h-2 rounded-sm"
                style={{
                  backgroundColor: arg.event.backgroundColor,
                }}
              />
              <h3 className="text-sm font-bold break-words">
                {event.code} {event.name}
              </h3>
              <div className="text-sm">
                {event.entries.map((entry, i) => {
                  if (entry.location) {
                    return (
                      <div className="text-sm text-foreground" key={i}>
                        {entry.type} @{" "}
                        <a
                          href={`https://maps.ntu.edu.sg/#/ntu/d386ffa80e4e46f286d17f08/poi/details/${entry.location.mapIndoorsId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span className="underline">{entry.venue}</span>
                        </a>
                        , Wk {entry.weeks.join(", ")}
                      </div>
                    );
                  }
                  return (
                    <div className="text-sm text-foreground" key={i}>
                      {entry.type} @ {entry.venue}, Wk {entry.weeks.join(", ")}
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-row justify-between items-center">
                <div className="text-xs text-muted-foreground">
                  {event.timeStr}
                </div>
                {event.isError ? (
                  <div className="flex flex-row items-center gap-2">
                    <AlertTriangleIcon className="text-destructive size-4" />
                    <div className="text-xs text-destructive">
                      {event.index}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    {event.index}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        );
      }}
      allDaySlot={false}
      nowIndicator={false}
      now={undefined}
      contentHeight={calendarHeight}
      height={calendarHeight}
      // height="100%"
      // contentHeight="auto"
      // height="auto"
      slotMinTime="08:00:00"
      slotMaxTime="23:59:00"
      dayHeaderFormat={{ weekday: "short" }}
      slotLabelFormat={{ hour: "numeric", minute: "2-digit", hour12: false }}
      eventTimeFormat={{ hour: "numeric", minute: "2-digit", hour12: false }}
      // contentHeight="auto"
    />
  );
}
