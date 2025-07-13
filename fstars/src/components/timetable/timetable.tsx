"use client";
import { useShallow } from "zustand/react/shallow";
import { useTimetableStore } from "./timetable-store";
import { asProgramName } from "./select-program-combox";
import { Skeleton } from "../ui/skeleton";
import { Button } from "../ui/button";
import { PlusIcon } from "lucide-react";
import { useMemo } from "react";
import { SelectPlanCombobox } from "./select-plan-combobox";

export function TimetableHeader({ id }: { id: string }) {
  const timetable = useTimetableStore(
    useShallow((state) => {
      const timetable = state.timetables.get(id);
      if (!timetable) {
        return null;
      }
      return {
        name: timetable.name,
        program: timetable.program,
        acadYear: timetable.acadYear,
      };
    })
  );

  return (
    <div className="w-full flex flex-col">
      {timetable !== null ? (
        <>
          <p className="text-sm text-muted-foreground h-6">
            {asProgramName(timetable.program)} - AY{timetable.acadYear.yearCode}{" "}
            Semester {timetable.acadYear.semesterCode}
          </p>
          <h1 className="text-2xl font-semibold h-12">{timetable.name}</h1>
        </>
      ) : (
        <>
          <div className="h-6 py-1 w-1/4">
            <Skeleton className="h-full w-full rounded-md" />
          </div>
          <div className="h-12 py-2 w-1/2">
            <Skeleton className="h-full w-full rounded-md" />
          </div>
        </>
      )}
    </div>
  );
}

export function TimetableCoursesPanel({ id }: { id: string }) {
  const timetable = useTimetableStore(
    useShallow((state) => {
      const timetable = state.timetables.get(id);
      if (!timetable) {
        return null;
      }

      return {
        courses: timetable.courses,
        plans: timetable.plans,
        selectedPlanId: timetable.selectedPlanId,
        changeTimetablePlan: state.changeTimetablePlan,
      };
    })
  );
  const selectedPlan = useMemo(() => {
    if (!timetable?.plans) return null;
    return timetable.plans.get(timetable.selectedPlanId);
  }, [timetable?.plans, timetable?.selectedPlanId]);
  const plansArray = useMemo(() => {
    if (!timetable?.plans) return [];
    return Array.from(timetable.plans.values());
  }, [timetable?.plans]);

  return (
    <div className="w-full border border-border bg-card rounded-lg p-4 gap-2 flex flex-col">
      <h2 className="text-base font-semibold">Courses</h2>
      <div className="flex flex-row gap-2">
        <SelectPlanCombobox
          value={selectedPlan ?? null}
          onChange={(plan) => {
            timetable?.changeTimetablePlan(id, plan?.id ?? "");
          }}
          plans={plansArray}
        />
        {/* <Button
          variant="outline"
          className="text-left flex flex-row items-center justify-start flex-1 px-2"
        >
          Hello
        </Button> */}
        <Button variant="secondary" size="icon">
          <PlusIcon className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
