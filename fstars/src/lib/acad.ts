import { DateTime } from "luxon";
import { AcadYear } from "./types";

export type RawDayDate = [number, number, number];

const acadYearWeeks: {
  [key: string]: {
    ay: `${number}/${number}`;
    semester: "1" | "2" | "S";
    start: RawDayDate;
    end: RawDayDate;
    weeks: {
      week: number;
      start: RawDayDate;
      end: RawDayDate;
    }[];
  };
} = {
  "24/25 S1": {
    ay: "24/25",
    semester: "1",
    start: [2024, 8, 11],
    end: [2024, 12, 31],
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
      {
        week: 14,
        start: [2024, 11, 17],
        end: [2024, 11, 23],
      },
    ],
  },
  "25/26 S1": {
    ay: "25/26",
    semester: "1",
    start: [2025, 7, 1],
    end: [2025, 12, 31],
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
      {
        week: 14,
        start: [2025, 11, 16],
        end: [2025, 11, 22],
      },
    ],
  },
  "25/26 S2": {
    ay: "25/26",
    semester: "2",
    start: [2026, 1, 2],
    end: [2026, 5, 31],
    weeks: [
      {
        week: 1,
        start: [2026, 1, 11],
        end: [2026, 1, 17],
      },
      {
        week: 2,
        start: [2026, 1, 18],
        end: [2026, 1, 24],
      },
      {
        week: 3,
        start: [2026, 1, 25],
        end: [2026, 1, 31],
      },
      {
        week: 4,
        start: [2026, 2, 1],
        end: [2026, 2, 7],
      },
      {
        week: 5,
        start: [2026, 2, 8],
        end: [2026, 2, 14],
      },
      {
        week: 6,
        start: [2026, 2, 15],
        end: [2026, 2, 21],
      },
      {
        week: 7,
        start: [2026, 2, 22],
        end: [2026, 2, 28],
      },
      {
        week: 8,
        start: [2026, 3, 8],
        end: [2026, 3, 14],
      },
      {
        week: 9,
        start: [2026, 3, 15],
        end: [2026, 3, 21],
      },
      {
        week: 10,
        start: [2026, 3, 22],
        end: [2026, 3, 28],
      },
      {
        week: 11,
        start: [2026, 3, 29],
        end: [2026, 4, 4],
      },
      {
        week: 12,
        start: [2026, 4, 5],
        end: [2026, 4, 11],
      },
      {
        week: 13,
        start: [2026, 4, 12],
        end: [2026, 4, 18],
      },
      {
        week: 14,
        start: [2026, 4, 19],
        end: [2026, 4, 25],
      },
    ],
  },
  "25/26 SS": {
    ay: "25/26",
    semester: "S",
    start: [2026, 5, 1],
    end: [2026, 5, 31],
    weeks: [
      {
        week: 1,
        start: [2026, 5, 10],
        end: [2026, 5, 16],
      },
      {
        week: 2,
        start: [2026, 5, 17],
        end: [2026, 5, 23],
      },
      {
        week: 3,
        start: [2026, 5, 24],
        end: [2026, 5, 30],
      },
      {
        week: 4,
        start: [2026, 5, 31],
        end: [2026, 6, 6],
      },
      {
        week: 5,
        start: [2026, 6, 7],
        end: [2026, 6, 13],
      },
      {
        week: 6,
        start: [2026, 6, 14],
        end: [2026, 6, 20],
      },
      {
        week: 7,
        start: [2026, 6, 21],
        end: [2026, 6, 27],
      },
      {
        week: 8,
        start: [2026, 6, 28],
        end: [2026, 7, 4],
      },
      {
        week: 9,
        start: [2026, 7, 5],
        end: [2026, 7, 11],
      },
      {
        week: 10,
        start: [2026, 7, 12],
        end: [2026, 7, 18],
      },
      {
        week: 11,
        start: [2026, 7, 19],
        end: [2026, 7, 25],
      },
      {
        week: 12,
        start: [2026, 7, 26],
        end: [2026, 8, 1],
      },
    ],
  },
};

export function getAcadWeeks(acadYear: AcadYear) {
  const acadYearKey = `${acadYear.yearCode} S${acadYear.semesterCode}`;
  if (!acadYearWeeks[acadYearKey]) {
    return [];
  }
  return acadYearWeeks[acadYearKey].weeks;
}

export function getAcadWeek(date: DateTime<boolean>) {
  const day = date.day;
  const month = date.month;
  const year = date.year;

  for (const [key, value] of Object.entries(acadYearWeeks)) {
    // Check which academic year this date is in
    const first = value.start;
    const end = value.end;

    const isLaterThanStart =
      year >= first[0] && month >= first[1] && day >= first[2];
    const isEarlierThanEnd = year <= end[0] && month <= end[1] && day <= end[2];
    if (!(isLaterThanStart && isEarlierThanEnd)) {
      continue;
    }

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
          acadYearKey: key,
          week: week.week,
          acadSem: {
            ay: value.ay,
            semester: value.semester,
          },
        };
      }
    }
    return {
      acadYearKey: key,
      acadSem: {
        ay: value.ay,
        semester: value.semester,
      },
    };
  }
  return null;
}

export function translateBuilding(building: string) {
  switch (building) {
    case "NMS":
      return "North Spine";
    case "SMS":
      return "South Spine";
    case "TheArc":
      return "The Arc";
    case "THE_HIVE":
      return "The Hive";
  }
  return building;
}

export function getNow() {
  const currentDateTime = DateTime.now().setZone("Asia/Singapore");
  // const currentDateTime = DateTime.now().setZone("Asia/Singapore").set({
  //   day: 6,
  //   month: 4,
  //   year: 2026,
  //   hour: 12,
  //   minute: 30,
  // });

  return currentDateTime;
}
