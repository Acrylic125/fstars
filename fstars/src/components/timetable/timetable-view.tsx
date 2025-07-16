"use client";
import React, { useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import "./fullcalendar.css";
import { useTimetableStore } from "./timetable-store";
import { useShallow } from "zustand/react/shallow";
import { trpc } from "@/server/client";
import { colorByIndex, ColorScheme } from "./utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type FCEvent = {
  title: string;
  start: Date;
  end: Date;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
};

type ExtendedProps = {
  code: string;
  name: string;
  index: string;
  entries: {
    type: string;
    venue: string;
    weeks: number[];
  }[];
};

function getEventDate(dayOffset: number, hour: number, minute: number) {
  const now = new Date();
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  const date = new Date(startOfWeek);
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date;
}

export function TimetableView({ id }: { id: string }) {
  const colorScheme: ColorScheme = "default";
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
    return Array.from(timetableStore.courses.entries())
      .map(([courseCode, index]) => ({
        courseCode,
        index: index.index,
      }))
      .filter((c) => c.index !== "");
  }, [timetableStore?.courses]);
  const selectedCourseClasses = trpc.getCourseIndexClasses.useQuery(
    {
      courses: courseCodes ?? [],
      acadYear: timetableStore?.acadYear ?? {
        yearCode: "",
        semesterCode: "",
      },
    },
    {
      enabled: !!courseCodes && !!timetableStore?.acadYear,
    }
  );

  const events = useMemo(() => {
    if (!timetableStore?.courses) {
      return [];
    }

    if (!selectedCourseClasses.data) {
      return [];
    }

    const aggregatedEventMap: Map<string, FCEvent & ExtendedProps> = new Map();
    for (const c of selectedCourseClasses.data) {
      const groupKey = `${c.course.code}-${c.day}-${c.from.hour}:${c.from.minute}-${c.to.hour}${c.to.minute}`;
      const group = aggregatedEventMap.get(groupKey);
      if (!group) {
        const i = courseCodes.findIndex(
          (cc) => cc.courseCode === c.course.code
        );
        const color = colorByIndex(i, {
          max: courseCodes.length,
          scheme: colorScheme,
        });
        const event: FCEvent & ExtendedProps = {
          title: c.course.code,
          start: getEventDate(c.day + 1, c.from.hour, c.from.minute),
          end: getEventDate(c.day + 1, c.to.hour, c.to.minute),
          backgroundColor: color.backgroundColor,
          borderColor: color.backgroundColor,
          textColor: color.color,
          code: c.course.code,
          name: c.course.name,
          index: c.index,
          entries: [
            {
              type: c.type,
              venue: c.venue,
              weeks: c.weeks,
            },
          ],
        };
        aggregatedEventMap.set(groupKey, event);
        continue;
      }

      group.entries.push({
        type: c.type,
        venue: c.venue,
        weeks: c.weeks,
      });
    }
    return Array.from(aggregatedEventMap.values());
  }, [timetableStore?.courses, selectedCourseClasses.data, courseCodes]);

  return (
    <FullCalendar
      plugins={[timeGridPlugin]}
      initialView="timeGridWeek"
      headerToolbar={false}
      expandRows={true}
      events={events}
      eventContent={(arg) => {
        // Annoying type casting.
        const event = arg.event.extendedProps as ExtendedProps;
        return (
          <Popover>
            <PopoverTrigger asChild>
              <div className="w-full h-full px-1">
                <h3 className="text-sm font-bold text-neutral-950">
                  {arg.event.extendedProps.code ?? "No Code"}
                </h3>
                {event.entries.map((entry, i) => {
                  return (
                    <div className="text-sm truncate text-neutral-600">
                      {entry.type} | {entry.venue} | {entry.weeks.join(", ")}
                    </div>
                  );
                })}
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
                  return (
                    <div className="text-sm text-foreground" key={i}>
                      {entry.type} @ {entry.venue}, Wk {entry.weeks.join(", ")}
                    </div>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        );
      }}
      allDaySlot={false}
      nowIndicator={false}
      now={undefined}
      height="100%"
      // contentHeight="auto"
      // height="auto"
      slotMinTime="08:00:00"
      slotMaxTime="20:00:00"
      dayHeaderFormat={{ weekday: "short" }}
      slotLabelFormat={{ hour: "numeric", minute: "2-digit", hour12: false }}
      // contentHeight="auto"
    />
  );
}
