"use client";

import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import "../timetable/fullcalendar.css";

export function VacantClassroomCalendar({
  events,
}: {
  events: { for: string; from: Date; to: Date }[];
}) {
  return (
    <FullCalendar
      plugins={[timeGridPlugin]}
      initialView="timeGridWeek"
      headerToolbar={false}
      expandRows={true}
      events={[
        ...events.map((event) => ({
          title: event.for,
          start: event.from,
          end: event.to,
          backgroundColor: "bg-green-500",
          borderColor: "bg-green-500",
          textColor: "text-white",
        })),
      ]}
      allDaySlot={false}
      nowIndicator={false}
      now={undefined}
      height="100%"
      slotMinTime="08:00:00"
      slotMaxTime="23:59:00"
      dayHeaderFormat={{ weekday: "short" }}
      slotLabelFormat={{ hour: "numeric", minute: "2-digit", hour12: false }}
    />
  );
}
