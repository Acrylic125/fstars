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
  "25/26 S1": {
    weeks: [
      {
        week: 1,
        start: [2025, 8, 11],
        end: [2025, 8, 17],
      },
      {
        week: 2,
        start: [2025, 8, 18],
        end: [2025, 8, 24],
      },
      {
        week: 3,
        start: [2025, 8, 25],
        end: [2025, 8, 31],
      },
      {
        week: 4,
        start: [2025, 9, 1],
        end: [2025, 9, 7],
      },
      {
        week: 5,
        start: [2025, 9, 8],
        end: [2025, 9, 14],
      },
      {
        week: 6,
        start: [2025, 9, 15],
        end: [2025, 9, 21],
      },
      {
        week: 7,
        start: [2025, 9, 22],
        end: [2025, 9, 28],
      },
      {
        week: 8,
        start: [2025, 10, 6],
        end: [2025, 10, 12],
      },
      {
        week: 9,
        start: [2025, 10, 13],
        end: [2025, 10, 19],
      },
      {
        week: 10,
        start: [2025, 10, 20],
        end: [2025, 10, 26],
      },
      {
        week: 11,
        start: [2025, 10, 27],
        end: [2025, 11, 2],
      },
      {
        week: 12,
        start: [2025, 11, 3],
        end: [2025, 11, 9],
      },
      {
        week: 13,
        start: [2025, 11, 10],
        end: [2025, 11, 16],
      },
    ],
  },
};

export function getAcadWeek(date: DateTime<boolean>) {
  const day = date.day;
  const month = date.month;
  const year = date.year;
  const rawDate = [year, month, day];

  for (const [key, value] of Object.entries(acadYearWeeks)) {
    for (const week of value.weeks) {
      if (rawDate >= week.start && rawDate <= week.end) {
        return {
          acadYear: key,
          week: week.week,
        };
      }
    }
  }
  return null;
}
