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

export default function Home() {
  return (
    <div className="flex flex-col h-screen max-w-ui mx-auto px-12 py-8 md:px-20 md:py-12 gap-4">
      <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">
        Timetable
      </h1>
    </div>
  );
}
