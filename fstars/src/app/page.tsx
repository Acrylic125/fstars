import Image from "next/image";
import React from "react";

const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const rows = 20;

export type Day = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";

export type Time = {
  hour: number;
  minute: number;
};

export type Timeslot = {
  day: Day;
  from: Time;
  to: Time;
  type: string;
  weeks: number[];
};

export type Timetable = {
  courses: {
    [courseCode: string]: {
      index: string;
      color: string;
      timeslots: Timeslot[];
    };
  };
};
const sampleTimeTable: Timetable = {
  courses: {
    SC2001: {
      index: "10130",
      color: "#d1fefb",
      timeslots: [
        {
          day: "MON",
          from: { hour: 12, minute: 30 },
          to: { hour: 14, minute: 20 },
          type: "LEC/STUDIO",
          weeks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
        },
        {
          day: "THU",
          from: { hour: 16, minute: 30 },
          to: { hour: 17, minute: 20 },
          type: "TUT",
          weeks: [2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13],
        },
        {
          day: "THU",
          from: { hour: 16, minute: 30 },
          to: { hour: 17, minute: 20 },
          type: "TUT",
          weeks: [10],
        },
        {
          day: "MON",
          from: { hour: 10, minute: 30 },
          to: { hour: 12, minute: 20 },
          type: "LAB",
          weeks: [1, 3, 5, 7, 9, 11, 13],
        },
      ],
    },
    SC2005: {
      index: "10178",
      color: "#fef4d1",
      timeslots: [
        {
          day: "FRI",
          from: { hour: 11, minute: 30 },
          to: { hour: 12, minute: 20 },
          type: "LEC/STUDIO",
          weeks: [10],
        },
        {
          day: "FRI",
          from: { hour: 11, minute: 30 },
          to: { hour: 12, minute: 20 },
          type: "LEC/STUDIO",
          weeks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13],
        },
        {
          day: "THU",
          from: { hour: 12, minute: 30 },
          to: { hour: 13, minute: 20 },
          type: "LEC/STUDIO",
          weeks: [1, 2, 3, 4, 6, 7, 8, 9, 11, 12, 13],
        },
        {
          day: "THU",
          from: { hour: 12, minute: 30 },
          to: { hour: 13, minute: 20 },
          type: "LEC/STUDIO",
          weeks: [10],
        },
        {
          day: "THU",
          from: { hour: 12, minute: 30 },
          to: { hour: 13, minute: 20 },
          type: "LEC/STUDIO",
          weeks: [5],
        },
        {
          day: "MON",
          from: { hour: 9, minute: 30 },
          to: { hour: 10, minute: 20 },
          type: "TUT",
          weeks: [10],
        },
        {
          day: "MON",
          from: { hour: 9, minute: 30 },
          to: { hour: 10, minute: 20 },
          type: "TUT",
          weeks: [2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13],
        },
        {
          day: "TUE",
          from: { hour: 14, minute: 30 },
          to: { hour: 16, minute: 20 },
          type: "LAB",
          weeks: [2, 4, 6, 8, 10, 12],
        },
      ],
    },
    SC2006: {
      index: "10196",
      color: "#ddfed1",
      timeslots: [
        {
          day: "MON",
          from: { hour: 8, minute: 30 },
          to: { hour: 9, minute: 20 },
          type: "LEC/STUDIO",
          weeks: [10],
        },
        {
          day: "MON",
          from: { hour: 8, minute: 30 },
          to: { hour: 9, minute: 20 },
          type: "LEC/STUDIO",
          weeks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13],
        },
        {
          day: "THU",
          from: { hour: 13, minute: 30 },
          to: { hour: 14, minute: 20 },
          type: "LEC/STUDIO",
          weeks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13],
        },
        {
          day: "THU",
          from: { hour: 13, minute: 30 },
          to: { hour: 14, minute: 20 },
          type: "LEC/STUDIO",
          weeks: [10],
        },
        {
          day: "FRI",
          from: { hour: 12, minute: 30 },
          to: { hour: 13, minute: 20 },
          type: "TUT",
          weeks: [2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13],
        },
        {
          day: "FRI",
          from: { hour: 12, minute: 30 },
          to: { hour: 13, minute: 20 },
          type: "TUT",
          weeks: [10],
        },
        {
          day: "WED",
          from: { hour: 14, minute: 30 },
          to: { hour: 16, minute: 20 },
          type: "LAB",
          weeks: [1, 3, 5, 7, 9, 11, 13],
        },
      ],
    },
    SC2008: {
      index: "10221",
      color: "#d1dffe",
      timeslots: [
        {
          day: "TUE",
          from: { hour: 10, minute: 30 },
          to: { hour: 12, minute: 20 },
          type: "LEC/STUDIO",
          weeks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13],
        },
        {
          day: "TUE",
          from: { hour: 10, minute: 30 },
          to: { hour: 12, minute: 20 },
          type: "LEC/STUDIO",
          weeks: [10],
        },
        {
          day: "TUE",
          from: { hour: 16, minute: 30 },
          to: { hour: 17, minute: 20 },
          type: "TUT",
          weeks: [10],
        },
        {
          day: "TUE",
          from: { hour: 16, minute: 30 },
          to: { hour: 17, minute: 20 },
          type: "TUT",
          weeks: [2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13],
        },
        {
          day: "MON",
          from: { hour: 14, minute: 30 },
          to: { hour: 16, minute: 20 },
          type: "LAB",
          weeks: [2, 4, 6, 8, 10, 12],
        },
      ],
    },
    SC2203: {
      index: "10261",
      color: "#e2d1fe",
      timeslots: [
        {
          day: "TUE",
          from: { hour: 8, minute: 30 },
          to: { hour: 10, minute: 20 },
          type: "LEC/STUDIO",
          weeks: [10],
        },
        {
          day: "TUE",
          from: { hour: 8, minute: 30 },
          to: { hour: 10, minute: 20 },
          type: "LEC/STUDIO",
          weeks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13],
        },
        {
          day: "TUE",
          from: { hour: 13, minute: 30 },
          to: { hour: 14, minute: 20 },
          type: "TUT",
          weeks: [10],
        },
        {
          day: "TUE",
          from: { hour: 13, minute: 30 },
          to: { hour: 14, minute: 20 },
          type: "TUT",
          weeks: [2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13],
        },
      ],
    },
  },
};

export function TimetableView({ timetable }: { timetable: Timetable }) {
  // Time range: 8am to 9pm (21:00), 1h intervals
  const startHour = 8;
  const endHour = 21;
  const hours = Array.from(
    { length: endHour - startHour },
    (_, i) => startHour + i
  );
  const dayNames = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const dayMap: Record<Day, string> = {
    MON: "Monday",
    TUE: "Tuesday",
    WED: "Wednesday",
    THU: "Thursday",
    FRI: "Friday",
    SAT: "Saturday",
    SUN: "Sunday",
  };

  // Flatten all timeslots with course info
  const allTimeslots = Object.entries(timetable.courses).flatMap(
    ([courseCode, course]) =>
      course.timeslots.map((slot) => ({
        ...slot,
        courseCode,
        color: course.color,
        type: slot.type,
      }))
  );

  // Group timeslots by day
  const timeslotsByDay: Record<string, any[]> = {};
  dayNames.forEach((day) => (timeslotsByDay[day] = []));
  allTimeslots.forEach((slot) => {
    const day = dayMap[slot.day];
    timeslotsByDay[day].push(slot);
  });

  // Helper to get minutes from 8am
  function getMinutesSinceStart(time: Time) {
    return (time.hour - startHour) * 60 + time.minute;
  }
  const totalMinutes = (endHour - startHour) * 60;

  return (
    <div className="overflow-x-auto">
      <div
        className="grid"
        style={{ gridTemplateColumns: `80px repeat(7, 1fr)` }}
      >
        {/* Header Row */}
        <div className="bg-gray-800 border border-gray-700 p-2 flex items-center justify-center font-bold text-white sticky left-0 z-10">
          Time
        </div>
        {dayNames.map((day) => (
          <div
            key={day}
            className="bg-gray-800 border border-gray-700 p-2 flex items-center justify-center font-bold text-white"
          >
            {day}
          </div>
        ))}
        {/* Time Rows */}
        {hours.map((hour) => (
          <React.Fragment key={hour}>
            {/* Time label */}
            <div
              className="bg-gray-900 border border-gray-700 p-2 flex items-center justify-center text-white sticky left-0 z-10"
              style={{ minHeight: 48 }}
            >
              {`${hour}:00`}
            </div>
            {/* Day columns */}
            {dayNames.map((day) => (
              <div
                key={day + hour}
                className="relative bg-gray-900 border border-gray-700 p-0"
                style={{ minHeight: 48 }}
              >
                {/* Render timeslot blocks for this day that overlap this hour */}
                {timeslotsByDay[day]
                  .filter((slot) => {
                    const from = slot.from.hour + slot.from.minute / 60;
                    const to = slot.to.hour + slot.to.minute / 60;
                    return from < hour + 1 && to > hour;
                  })
                  .map((slot, idx) => {
                    // Calculate top and height as % of the cell (48px)
                    const slotStart = Math.max(
                      getMinutesSinceStart(slot.from),
                      hour * 60
                    );
                    const slotEnd = Math.min(
                      getMinutesSinceStart(slot.to),
                      (hour + 1) * 60
                    );
                    const top = ((slotStart - hour * 60) / 60) * 48;
                    const height = ((slotEnd - slotStart) / 60) * 48;
                    return (
                      <div
                        key={
                          slot.courseCode +
                          slot.type +
                          slot.from.hour +
                          slot.from.minute +
                          idx
                        }
                        className="absolute left-1 right-1 rounded-md shadow text-xs flex flex-col justify-center items-center border border-black/10 overflow-hidden"
                        style={{
                          top,
                          height,
                          background: slot.color,
                          zIndex: 2,
                        }}
                        title={`${slot.courseCode} ${slot.type}`}
                      >
                        <span className="font-bold">{slot.courseCode}</span>
                        <span>{slot.type}</span>
                        <span className="text-[10px]">
                          {`${slot.from.hour}:${slot.from.minute.toString().padStart(2, "0")}`}
                          -
                          {`${slot.to.hour}:${slot.to.minute.toString().padStart(2, "0")}`}
                        </span>
                      </div>
                    );
                  })}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col h-screen max-w-ui mx-auto px-12 py-8 md:px-20 md:py-12 gap-4">
      <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">
        Timetable
      </h1>
      <TimetableView timetable={sampleTimeTable} />
      {/* <div className="w-full h-fit border border-gray-700 rounded-lg">
        <div className="w-full h-fit overflow-x-auto max-w-ui flex flex-col">
          <div className="grid grid-cols-8 min-w-5xl">
            <div className="flex flex-col items-center justify-center bg-gray-800 border border-gray-700 p-4">
              <h3 className="text-base md:text-lg lg:text-xl font-medium text-white">
                Time
              </h3>
            </div>
            {days.map((day) => (
              <div
                key={day}
                className="flex flex-col items-center justify-center bg-gray-800 border border-gray-700 p-4"
              >
                <h3 className="text-base md:text-lg lg:text-xl font-medium text-white">
                  {day}
                </h3>
              </div>
            ))}
            {days.map((day) => {
              return Array.from({ length: rows }).map((_, index) => (
                <div
                  key={day + index}
                  className="flex flex-col items-center justify-center bg-gray-900 border border-gray-700 p-4"
                >
                  <h3 className="text-base md:text-lg lg:text-xl font-medium text-white">
                    {index + 1}
                  </h3>
                </div>
              ));
            })}
          </div>
        </div>
      </div> */}
    </div>
  );
}
