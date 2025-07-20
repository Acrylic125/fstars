import { CourseCode } from "@/components/timetable/timetable-store";

export type Time = {
  hour: number;
  minute: number;
};

export type Hour = number;
export type Minute = number;
export type TimeAsArray = [Hour, Minute];

export type IndexClass = {
  startTime: TimeAsArray;
  endTime: TimeAsArray;
  day: number;
  weeks: number[];
};

export type CourseIndexClasses = {
  index: string;
  classes: IndexClass[];
};

export type CourseClasses = {
  courseCode: CourseCode;
  indexes: CourseIndexClasses[];
};

export function toTimeAsArray(time: Time): TimeAsArray {
  return [time.hour, time.minute] as const;
}

export function toTime(time: TimeAsArray) {
  return {
    hour: time[0],
    minute: time[1],
  } as const;
}

export function toMinutes(time: Time) {
  return time.hour * 60 + time.minute;
}

export function isIntersectingDate(
  time1: {
    from: Date;
    to: Date;
  },
  time2: {
    from: Date;
    to: Date;
  }
) {
  const time1Start = time1.from.getTime();
  const time1End = time1.to.getTime();
  const time2Start = time2.from.getTime();
  const time2End = time2.to.getTime();

  return time1Start < time2End && time2Start < time1End;
}

export function isIntersecting(
  time1: {
    from: Time;
    to: Time;
  },
  time2: {
    from: Time;
    to: Time;
  }
) {
  const time1Start = toMinutes(time1.from);
  const time1End = toMinutes(time1.to);
  const time2Start = toMinutes(time2.from);
  const time2End = toMinutes(time2.to);

  return time1Start < time2End && time2Start < time1End;
}

export function isWithinRange(
  val: number,
  range: [number | null, number | null]
) {
  if (range[0] === null && range[1] === null) {
    return true;
  }
  if (range[0] === null && range[1] !== null) {
    return val <= range[1]!;
  }
  if (range[1] === null && range[0] !== null) {
    return val >= range[0];
  }
  return val >= range[0]! && val <= range[1]!;
}

export function isBeforeOrEqual(before: Time, after: Time) {
  if (before.hour < after.hour) {
    return true;
  }
  if (before.hour === after.hour && before.minute <= after.minute) {
    return true;
  }
  return false;
}
