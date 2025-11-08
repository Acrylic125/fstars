import { DateTime } from "luxon";

export type RawDayDate = [number, number, number];

const acadYearWeeks: {
  [key: string]: {
    weeks: {
      week: number;
      start: RawDayDate;
      end: RawDayDate;
    }[];
  };
} = {
  "24/25 S1": {
    weeks: [
      {
        week: 1,
        start: [2024, 8, 11],
        end: [2024, 8, 17],
      },
      {
        week: 2,
        start: [2024, 8, 18],
        end: [2024, 8, 24],
      },
      {
        week: 3,
        start: [2024, 8, 25],
        end: [2024, 8, 31],
      },
      {
        week: 4,
        start: [2024, 9, 1],
        end: [2024, 9, 7],
      },
      {
        week: 5,
        start: [2024, 9, 8],
        end: [2024, 9, 14],
      },
      {
        week: 6,
        start: [2024, 9, 15],
        end: [2024, 9, 21],
      },
      {
        week: 7,
        start: [2024, 9, 22],
        end: [2024, 9, 28],
      },
      {
        week: 8,
        start: [2024, 10, 6],
        end: [2024, 10, 12],
      },
      {
        week: 9,
        start: [2024, 10, 13],
        end: [2024, 10, 19],
      },
      {
        week: 10,
        start: [2024, 10, 20],
        end: [2024, 10, 26],
      },
      {
        week: 11,
        start: [2024, 10, 27],
        end: [2024, 11, 2],
      },
      {
        week: 12,
        start: [2024, 11, 3],
        end: [2024, 11, 9],
      },
      {
        week: 13,
        start: [2024, 11, 10],
        end: [2024, 11, 16],
      },
    ],
  },
  "25/26 S1": {
    weeks: [
      {
        week: 1,
        start: [2025, 8, 10],
        end: [2025, 8, 16],
      },
      {
        week: 2,
        start: [2025, 8, 17],
        end: [2025, 8, 23],
      },
      {
        week: 3,
        start: [2025, 8, 24],
        end: [2025, 8, 30],
      },
      {
        week: 4,
        start: [2025, 8, 31],
        end: [2025, 9, 6],
      },
      {
        week: 5,
        start: [2025, 9, 7],
        end: [2025, 9, 13],
      },
      {
        week: 6,
        start: [2025, 9, 14],
        end: [2025, 9, 20],
      },
      {
        week: 7,
        start: [2025, 9, 21],
        end: [2025, 9, 27],
      },
      {
        week: 8,
        start: [2025, 10, 5],
        end: [2025, 10, 11],
      },
      {
        week: 9,
        start: [2025, 10, 12],
        end: [2025, 10, 18],
      },
      {
        week: 10,
        start: [2025, 10, 19],
        end: [2025, 10, 25],
      },
      {
        week: 11,
        start: [2025, 10, 26],
        end: [2025, 11, 1],
      },
      {
        week: 12,
        start: [2025, 11, 2],
        end: [2025, 11, 8],
      },
      {
        week: 13,
        start: [2025, 11, 9],
        end: [2025, 11, 15],
      },
    ],
  },
};

export function getAcadWeek(date: DateTime<boolean>) {
  const day = date.day;
  const month = date.month;
  const year = date.year;

  for (const [key, value] of Object.entries(acadYearWeeks)) {
    for (const week of value.weeks) {
      if (
        year >= week.start[0] &&
        month >= week.start[1] &&
        day >= week.start[2] &&
        year <= week.end[0] &&
        month <= week.end[1] &&
        day <= week.end[2]
      ) {
        return {
          acadYear: key,
          week: week.week,
        };
      }
    }
  }
  return null;
}
