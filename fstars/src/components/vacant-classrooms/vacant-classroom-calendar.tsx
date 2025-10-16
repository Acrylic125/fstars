"use client";

import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import "../timetable/fullcalendar.css";

export function VacantClassroomCalendar({
  events,
}: {
  events: { for: string; from: string; to: string }[];
}) {
  return (
    <FullCalendar
      plugins={[timeGridPlugin]}
      initialView="timeGridWeek"
      headerToolbar={false}
      expandRows={true}
      timeZone="Asia/Singapore"
      events={[
        ...events.map((event) => ({
          title: event.for,
          start: event.from,
          end: event.to,
          backgroundColor: "#6e11b0",
          borderColor: "#6e11b0",
          textColor: "#ffffff",
        })),
      ]}
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
