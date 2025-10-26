"use client";

import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import "../timetable/fullcalendar.css";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "@/lib/utils";
import { ArrowDownRightIcon } from "lucide-react";
import { formatTime } from "@/lib/utils";

export type VacantClassroomEvent = {
  for: { code: string; name: string; index: string };
  from: string;
  to: string;
  fromTime: { hour: number; minute: number };
  toTime: { hour: number; minute: number };
  weeks: number[];
};

export function VacantClassroomCalendar({
  events,
  startDate,
  endDate,
}: {
  events: VacantClassroomEvent[];
  startDate: string;
  endDate: string;
}) {
  return (
    <FullCalendar
      plugins={[timeGridPlugin]}
      initialView="timeGridWeek"
      headerToolbar={false}
      expandRows={true}
      timeZone="Asia/Singapore"
      validRange={{
        start: startDate,
        end: endDate,
      }}
      events={[
        ...events.map((event) => ({
          title: `${event.for.code}: ${event.for.name}`,
          start: event.from,
          end: event.to,
          extendedProps: event,
          backgroundColor: "#6e11b0",
          borderColor: "#6e11b0",
        })),
      ]}
      eventContent={(arg) => {
        // TODO: Annoying type casting.
        const event = arg.event.extendedProps as VacantClassroomEvent;
        const timeStr = `${formatTime(event.fromTime.hour, event.fromTime.minute)} - ${formatTime(event.toTime.hour, event.toTime.minute)}`;

        return (
          <Popover>
            <PopoverTrigger asChild>
              <div
                className={cn(
                  "relative flex flex-col justify-between w-full h-full px-1.5 py-0.5 rounded-xs cursor-pointer bg-purple-800 border border-purple-700 text-white"
                )}
              >
                <h3 className="text-sm font-bold text-white">
                  {event.for.code} {event.for.name}
                </h3>
                <div className="text-xs text-white">{timeStr}</div>
                <div
                  className={cn(
                    "absolute bottom-0 right-0 pb-1 pr-1 text-neutral-900"
                  )}
                >
                  <ArrowDownRightIcon className="size-4 text-white" />
                </div>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-80 flex flex-col gap-2">
              <h3 className="text-sm font-bold break-words">
                {event.for.code} {event.for.name}
              </h3>
              <div className="text-sm">Wk {event.weeks.join(", ")}</div>
              <div className="flex flex-row justify-between items-center">
                <div className="text-xs text-muted-foreground">{timeStr}</div>
                <div className="text-xs text-muted-foreground">
                  {event.for.index}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        );
      }}
      allDaySlot={false}
      nowIndicator={true}
      height="100%"
      slotMinTime="08:00:00"
      slotMaxTime="23:59:00"
      dayHeaderFormat={{ weekday: "short" }}
      slotLabelFormat={{ hour: "numeric", minute: "2-digit", hour12: false }}
      eventTimeFormat={{ hour: "numeric", minute: "2-digit", hour12: false }}
    />
  );
}
