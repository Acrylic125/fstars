"use client";
import { useShallow } from "zustand/react/shallow";
import { PlanId, useTimetableStore } from "./timetable-store";
import { asProgramName } from "./select-program-combox";
import { Skeleton } from "../ui/skeleton";
import { useMemo } from "react";
import { SelectPlanCombobox } from "./select-plan-combobox";
import { SelectCourseCombobox } from "./select-course-combobox";
import { trpc } from "@/server/client";
import { Button } from "../ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDownIcon, ChevronUpIcon, TrashIcon } from "lucide-react";
import { colorByIndex } from "./utils";
import { SelectIndexCombobox } from "./select-index-combobox";
import { type AppRouter } from "@/server/router";
import { inferRouterOutputs } from "@trpc/server";
import { AcadYear } from "@/lib/types";

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

type Course = inferRouterOutputs<AppRouter>["findCourses"][number];

export function TimetableCoursesRow({
  id,
  color,
  planId,
  courseCode,
  acadYear,
  course,
}: {
  id: string;
  color: string;
  planId: PlanId;
  courseCode: string;
  acadYear: AcadYear;
  course?: Course;
}) {
  const timetableStore = useTimetableStore(
    useShallow((state) => {
      return {
        removeCourseFromPlan: state.removeCourseFromPlan,
      };
    })
  );

  return (
    <Collapsible className="group/collapsible w-full">
      <CollapsibleTrigger asChild>
        <div
          role="button"
          tabIndex={0}
          aria-label={`${courseCode} - ${course?.name ?? ""}`}
          className="w-full flex flex-row items-center gap-2 px-4 py-2 hover:bg-neutral-100 focus-visible:bg-neutral-100 dark:hover:bg-neutral-800 dark:focus-visible:bg-neutral-800 outline-0 ring-0 cursor-pointer [&_svg]:pointer-events-none select-none"
        >
          <div
            className="flex-1 grid grid-cols-5 gap-1 w-full"
            key={courseCode}
          >
            <div className="flex-1 flex flex-row gap-2 items-center justify-start col-span-3">
              <div
                className="w-2 h-4 rounded-xs block"
                style={{
                  backgroundColor: color,
                }}
              />
              <div className="flex flex-row gap-1 flex-1 overflow-hidden text-nowrap text-sm">
                {courseCode}
                {!!course ? (
                  <span className="text-muted-foreground group-data-[state=open]/collapsible:hidden truncate">
                    {course.name}
                  </span>
                ) : null}
              </div>
            </div>
            {timetableStore ? (
              <SelectIndexCombobox
                courseCode={courseCode}
                timetableId={id}
                planId={planId}
                acadYear={acadYear}
              />
            ) : (
              <SelectIndexCombobox
                courseCode={courseCode}
                timetableId={id}
                planId={planId}
                acadYear={{
                  yearCode: "",
                  semesterCode: "",
                }}
                disabled
              />
            )}
          </div>
          <div className="text-muted-foreground hidden lg:block">
            <ChevronDownIcon className="w-4 h-4 group-data-[state=open]/collapsible:hidden" />
            <ChevronUpIcon className="w-4 h-4 group-data-[state=closed]/collapsible:hidden" />
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="flex flex-row justify-between w-full pr-4 pl-6">
          <div className="w-2 h-4 rounded-xs block opacity-0" />
          {!!course && (
            <div className="flex flex-col gap-2 py-2 flex-1">
              <span className="text-muted-foreground font-medium text-sm flex-1">
                {course.name}
              </span>

              <div className="">
                <p className="text-foreground text-sm inline">{course.au} </p>
                <p className="text-muted-foreground text-sm inline">AU</p>
              </div>
            </div>
          )}
          <div className="flex py-2">
            <Button
              variant="destructiveOutline"
              size="icon"
              onClick={() => {
                timetableStore?.removeCourseFromPlan({
                  timetableId: id,
                  planId,
                  courseCode,
                });
              }}
            >
              <TrashIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function TimetableCoursesPanel({ id }: { id: string }) {
  const timetableStore = useTimetableStore(
    useShallow((state) => {
      const timetable = state.timetables.get(id);
      if (!timetable) {
        return null;
      }

      return {
        program: timetable.program,
        acadYear: timetable.acadYear,
        plans: timetable.plans,
        selectedPlanId: timetable.selectedPlanId,
        selectedPlan: timetable.plans.get(timetable.selectedPlanId),
      };
    })
  );
  const selectedPlan = useMemo(() => {
    if (!timetableStore?.selectedPlan) return null;
    return {
      plan: timetableStore.selectedPlan,
      courses: Array.from(timetableStore.selectedPlan.courses.keys()),
    };
  }, [timetableStore?.selectedPlan]);
  const selectedPlanCourses = trpc.getCoursesByCodes.useQuery(
    {
      codes: selectedPlan?.courses ?? [],
    },
    {
      enabled: !!selectedPlan,
      placeholderData: (prev) => prev,
    }
  );
  const selectedPlanCoursesMap = useMemo(() => {
    if (!selectedPlanCourses.data) {
      return new Map<string, Course>();
    }
    return new Map(
      selectedPlanCourses.data.map((course) => [course.code, course])
    );
  }, [selectedPlanCourses.data]);

  return (
    <div className="w-full border border-border bg-card rounded-lg pt-4 pb-0 flex flex-col">
      <h2 className="text-base font-semibold px-4 pb-2">Courses</h2>
      <div className="flex flex-row gap-2 px-4">
        <SelectPlanCombobox timetableId={id} />
        {timetableStore && selectedPlan ? (
          <SelectCourseCombobox
            program={timetableStore.program}
            acadYear={timetableStore.acadYear}
            timetableId={id}
            selectedPlanId={selectedPlan.plan.id}
          />
        ) : (
          <SelectCourseCombobox
            program={{
              name: "",
              code: "",
              subCode: "",
              year: 0,
            }}
            acadYear={{
              yearCode: "",
              semesterCode: "",
            }}
            timetableId={id}
            selectedPlanId={""}
            disabled
          />
        )}
      </div>
      <div className="flex flex-col w-full py-2 items-center">
        {selectedPlan ? (
          <>
            {selectedPlan.courses.length > 0 ? (
              selectedPlan.courses.map((courseCode, index) => {
                const course = selectedPlanCoursesMap.get(courseCode);
                return (
                  <TimetableCoursesRow
                    key={courseCode}
                    id={id}
                    color={
                      colorByIndex(index, {
                        max: selectedPlan.courses.length,
                        scheme: "default",
                      }).backgroundColor
                    }
                    planId={selectedPlan.plan.id}
                    courseCode={courseCode}
                    course={course}
                    acadYear={
                      timetableStore?.acadYear ?? {
                        yearCode: "",
                        semesterCode: "",
                      }
                    }
                  />
                );
              })
            ) : (
              <div className="w-full flex flex-col min-h-24 gap-2 items-center justify-center text-muted-foreground text-center max-w-48">
                <p>
                  No courses added. Click{" "}
                  <span className="text-primary">+</span> to add one.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="w-full flex flex-col min-h-24 gap-2 items-center justify-center text-muted-foreground text-center max-w-48">
            <p>
              No plan selected. Click{" "}
              <span className="text-primary">Select Plan</span> to select one.
              plan.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
