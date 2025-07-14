"use client";

import { useShallow } from "zustand/react/shallow";
import { useTimetableStore } from "./timetable-store";
import { useMemo } from "react";
import Link from "next/link";
import { Button } from "../ui/button";

export function TimetableList() {
  const { timetables } = useTimetableStore(
    useShallow((state) => {
      return {
        timetables: state.timetables,
      };
    })
  );
  const timetablesCached = useMemo(() => {
    return Array.from(timetables.values()).map((timetable) => ({
      id: timetable.id,
      name: timetable.name,
      program: timetable.program,
      acadYear: timetable.acadYear,
    }));
  }, [timetables]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
      {timetablesCached.map((timetable) => (
        <Link
          href={`/timetable/${timetable.id}`}
          className="w-full border border-border rounded-md p-4 bg-card transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] ring-secondary hover:ring-[3px]"
        >
          <h3 className="text-lg font-semibold text-card-foreground">
            {timetable.name}
          </h3>
          <p className="text-sm text-muted-foreground">
            {timetable.program.name} - AY{timetable.acadYear.yearCode} Semester{" "}
            {timetable.acadYear.semesterCode}
          </p>
        </Link>
      ))}
    </div>
  );
}
