"use client";
import React from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import "./fullcalendar.css";

function getEventDate(dayOffset: number, hour: number, minute: number) {
  const now = new Date();
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  const date = new Date(startOfWeek);
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date;
}

const demoEvents = [
  {
    title: "Event A",
    start: getEventDate(2, 10, 0), // Tuesday 10am
    end: getEventDate(2, 12, 0), // Tuesday 12am (midnight)
    backgroundColor: "#e2d1fe",
    borderColor: "#e2d1fe",
    textColor: "#000",
    className: "bg-opacity-50",
    location: "Location A",
  },
  {
    title: "Event B",
    start: getEventDate(3, 9, 30), // Tuesday 9:30am
    end: getEventDate(3, 10, 30), // Tuesday 10am
    backgroundColor: "#d1fee8",
    borderColor: "#d1fee8",
    textColor: "#000",
    location: "Location B",
  },
  {
    title: "Event B",
    start: getEventDate(2, 9, 30), // Tuesday 9:30am
    end: getEventDate(2, 11, 30), // Tuesday 11:30am
    backgroundColor: "#d1fee8",
    borderColor: "#d1fee8",
    textColor: "#000",
    location: "Location B",
  },
  {
    title: "Event C",
    start: getEventDate(5, 13, 0), // Friday 1pm
    end: getEventDate(5, 15, 0), // Friday 3pm
    backgroundColor: "#fefbd1",
    borderColor: "#fefbd1",
    textColor: "#000",
    location: "Location C",
    className: "fc-error",
  },
];

export function Timetable() {
  return (
    <div className="h-[200em">
      <FullCalendar
        plugins={[timeGridPlugin]}
        initialView="timeGridWeek"
        headerToolbar={false}
        events={[...demoEvents]}
        eventContent={(arg) => {
          return {
            html: `
            <div class="event-title-container">
            <div class="event-title">${arg.event.title}</div>
            <div class="event-subtext">${arg.event.extendedProps.location}</div>
            </div>
            <div class="event-subtext">${arg.timeText}</div>
            `,
          };
        }}
        allDaySlot={false}
        nowIndicator={false}
        now={undefined}
        height="auto"
        slotMinTime="08:00:00"
        slotMaxTime="20:00:00"
        dayHeaderFormat={{ weekday: "short" }}
        slotLabelFormat={{ hour: "numeric", minute: "2-digit", hour12: false }}
        contentHeight="auto"
      />
    </div>
  );
}
