import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs";
import { CourseCode } from "./timetable-store";
import { useCallback, useMemo } from "react";

export type ColorScheme =
  | "default"
  | "grayscale"
  | "blue-scale"
  | "red-scale"
  | "green-scale"
  | "blue-red-scale"
  | "blue-green-scale"
  | "red-green-scale";

export function sortCourseCodes(courseCodes: CourseCode[]) {
  return courseCodes.sort((a, b) => a.localeCompare(b));
}

export function getColorMapForCourses(
  courseCodes: CourseCode[],
  colorScheme: ColorScheme
) {
  // const max = Math.max(courseCodes.length, 10);
  const max = courseCodes.length;
  // Sort course codes by code
  const sortedCourseCodes = sortCourseCodes(courseCodes);
  const map = new Map<string, ReturnType<typeof colorByIndex>>();
  for (let i = 0; i < sortedCourseCodes.length; i++) {
    const courseCode = sortedCourseCodes[i];
    const color = colorByIndex(i, { max, scheme: colorScheme });
    map.set(courseCode, color);
  }
  return map;
}

export function colorByIndex(
  index: number,
  config: {
    max: number;
    scheme: ColorScheme;
  }
) {
  switch (config.scheme) {
    case "default":
      return {
        backgroundColor: `hsl(${(index * 360) / (config.max + 1)}, 95%, 85%)`,
        color: "#000000",
      };
    case "grayscale":
      const grayscaleIndex = Math.round((index / config.max) * 100);
      return {
        backgroundColor: `hsl(0, 0%, ${grayscaleIndex}%)`,
        color: grayscaleIndex > 50 ? "#000000" : "#ffffff",
      };
    case "blue-red-scale":
      // 240 to 360 blue to red
      const blueRedScale = 240 + (index / config.max) * 120;
      return {
        backgroundColor: `hsl(${blueRedScale}, 95%, 80%)`,
        color: "#000000",
      };
    case "blue-green-scale":
      // 120 to 240 blue to green
      const blueGreenScale = 120 + (index / config.max) * 120;
      return {
        backgroundColor: `hsl(${blueGreenScale}, 95%, 80%)`,
        color: "#000000",
      };
    case "red-green-scale":
      // 0 to 120 red to green
      const redGreenScale = (index / config.max) * 120;
      return {
        backgroundColor: `hsl(${redGreenScale}, 95%, 80%)`,
        color: "#000000",
      };
    case "blue-scale":
      const blueIndex = Math.round((index / config.max) * 80) + 10;
      return {
        backgroundColor: `hsl(200, 100%, ${blueIndex}%)`,
        color: blueIndex > 50 ? "#000000" : "#ffffff",
      };
    case "red-scale":
      const redIndex = Math.round((index / config.max) * 80) + 10;
      return {
        backgroundColor: `hsl(0, 100%, ${redIndex}%)`,
        color: redIndex > 50 ? "#000000" : "#ffffff",
      };
    case "green-scale":
      const greenIndex = Math.round((index / config.max) * 80) + 10;
      return {
        backgroundColor: `hsl(120, 100%, ${greenIndex}%)`,
        color: greenIndex > 50 ? "#000000" : "#ffffff",
      };
  }
}

export function asPriority(index: number | undefined) {
  if (index === undefined) return "None" as const;
  switch (index) {
    case 0:
      return "None" as const;
    case 1:
      return "Not Preferred" as const;
    case 2:
      return "Preferred" as const;
    case 3:
      return "Important" as const;
    default:
      return "None" as const;
  }
}

export type Priority = ReturnType<typeof asPriority>;

export function asPriorityNumber(priority: Priority) {
  switch (priority) {
    case "None":
      return 0 as const;
    case "Not Preferred":
      return 1 as const;
    case "Preferred":
      return 2 as const;
    case "Important":
      return 3 as const;
    default:
      return 0 as const;
  }
}

export function useQueryParamCourses() {
  const [courseCodes, setCourseCodes] = useQueryState(
    "c",
    parseAsArrayOf(parseAsString).withDefault([])
  );

  const courseCodesMap = useMemo(() => {
    return courseCodes
      .map((c) => {
        const split = c.split(":");
        if (split.length !== 2) {
          return null;
        }
        const [courseCode, index] = split;
        return {
          courseCode,
          index,
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);
  }, [courseCodes]);

  const setter = useCallback(
    (
      courseCodes:
        | typeof courseCodesMap
        | ((prev: typeof courseCodesMap) => typeof courseCodesMap)
    ) => {
      if (typeof courseCodes === "function") {
        setCourseCodes(
          courseCodes(courseCodesMap).map((c) => `${c.courseCode}:${c.index}`)
        );
      } else {
        setCourseCodes(courseCodes.map((c) => `${c.courseCode}:${c.index}`));
      }
    },
    [setCourseCodes, courseCodesMap]
  );
  return [courseCodesMap, setter] as const;
}

export function serializeCourseCodes(
  courseCodes: {
    courseCode: string;
    index: string;
  }[]
) {
  return courseCodes.map((c) => `${c.courseCode}:${c.index}`).join(",");
}
