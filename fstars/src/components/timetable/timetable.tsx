"use client";
import { useShallow } from "zustand/react/shallow";
import { useTimetableStore } from "./timetable-store";
import { asProgramName } from "./select-program-combox";
import { Skeleton } from "../ui/skeleton";
import { useCallback, useMemo } from "react";
import { SelectPlanCombobox } from "./select-plan-combobox";
import {
  RequestAddCourse,
  SelectCourseCombobox,
} from "./select-course-combobox";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { trpc } from "@/server/client";
import { Button } from "../ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDownIcon, ChevronsUpDown, ChevronUpIcon } from "lucide-react";

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
        program: timetable.program,
        acadYear: timetable.acadYear,
        courses: timetable.courses,
        plans: timetable.plans,
        selectedPlanId: timetable.selectedPlanId,
        changeTimetablePlan: state.changeTimetablePlan,
        addCourseToPlan: state.addCourseToPlan,
      };
    })
  );
  const selectedPlan = useMemo(() => {
    if (!timetable?.plans) return null;
    const plan = timetable.plans.get(timetable.selectedPlanId);
    if (!plan) return null;
    return { plan, courses: Array.from(plan.courses.keys()) };
  }, [timetable?.plans, timetable?.selectedPlanId]);
  const plansArray = useMemo(() => {
    if (!timetable?.plans) return [];
    return Array.from(timetable.plans.values());
  }, [timetable?.plans]);
  const coursesReq = trpc.getCoursesByCodes.useQuery(
    {
      codes: selectedPlan?.courses ?? [],
    },
    {
      enabled: !!selectedPlan,
    }
  );
  const coursesMap = useMemo(() => {
    if (!coursesReq.data)
      return new Map<string, { code: string; name: string; au: number }>();
    return new Map(
      coursesReq.data.map((course) => [
        course.code,
        {
          code: course.code,
          name: course.name,
          au: course.au,
        },
      ])
    );
  }, [coursesReq.data]);

  const addCourseToPlan: RequestAddCourse = useCallback(
    (course) => {
      if (!timetable) return;
      if (!selectedPlan) return;
      timetable.addCourseToPlan(id, selectedPlan.plan.id, {
        code: course.code,
        index: "",
      });
    },
    [selectedPlan, timetable]
  );

  return (
    <div className="w-full border border-border bg-card rounded-lg pt-4 pb-0 flex flex-col">
      <h2 className="text-base font-semibold px-4 pb-2">Courses</h2>
      <div className="flex flex-row gap-2 px-4">
        <SelectPlanCombobox
          value={selectedPlan?.plan ?? null}
          onChange={(plan) => {
            timetable?.changeTimetablePlan(id, plan?.id ?? "");
          }}
          plans={plansArray}
        />
        {timetable ? (
          <SelectCourseCombobox
            program={timetable.program}
            acadYear={timetable.acadYear}
            requestAddCourse={addCourseToPlan}
            disabled={selectedPlan === null}
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
            disabled
          />
        )}
      </div>
      <div className="flex flex-col w-full py-2">
        {/* <div className="grid grid-cols-3 flex-1 flex-row overflow-hidden text-ellipsis text-nowrap">
          <div className="w-2 h-4 bg-amber-300 rounded-xs block" />
          <div className="grow">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Doloremque
            voluptatum, beatae voluptate eveniet ipsam, laborum illo
            exercitationem tempora culpa accusantium debitis illum autem
            eligendi nulla. Nisi voluptatibus est voluptas quia?
          </div>
        </div> */}
        {selectedPlan ? (
          <>
            {selectedPlan.courses.length > 0 ? (
              selectedPlan.courses.map((courseCode) => {
                const course = coursesMap.get(courseCode);
                const courseIndex = selectedPlan.plan.courses.get(courseCode);
                return (
                  <Collapsible key={courseCode} className="group/collapsible">
                    <CollapsibleTrigger className="w-full flex flex-row items-center gap-2 px-4 py-2 hover:bg-neutral-100 focus-visible:bg-neutral-100 dark:hover:bg-neutral-800 dark:focus-visible:bg-neutral-800 outline-0 ring-0">
                      <div
                        className="flex-1 grid grid-cols-5 gap-2 w-full"
                        key={courseCode}
                      >
                        <div className="flex-1 flex flex-row gap-2 items-center justify-start col-span-3">
                          <div className="w-2 h-4 bg-amber-300 rounded-xs block" />
                          <div className="flex flex-row gap-1 flex-1 overflow-hidden text-nowrap text-sm">
                            {courseCode}
                            {!!course ? (
                              <span className="text-muted-foreground group-data-[state=open]/collapsible:hidden">
                                {course.name}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          className="col-span-2 flex flex-row gap-2 px-2 items-center justify-start overflow-ellipsis whitespace-nowrap break-words text-muted-foreground"
                        >
                          {courseIndex?.index ?? "123456"}
                          <ChevronsUpDown />
                        </Button>
                      </div>
                      <div className="text-muted-foreground hidden lg:block">
                        <ChevronDownIcon className="w-4 h-4 group-data-[state=open]/collapsible:hidden" />
                        <ChevronUpIcon className="w-4 h-4 group-data-[state=closed]/collapsible:hidden" />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="flex flex-row w-full pr-4 pl-6">
                        <div className="w-2 h-4 bg-amber-300 rounded-xs block opacity-0" />
                        {!!course && (
                          <div className="flex flex-col gap-2 py-2">
                            <span className="text-muted-foreground text-sm">
                              {course.name}
                            </span>
                            <div className="">
                              <p className="text-foreground text-sm inline">
                                {course.au}{" "}
                              </p>
                              <p className="text-muted-foreground text-sm inline">
                                AU
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })
            ) : (
              <div className="flex flex-col min-h-20 gap-2 items-center justify-center text-muted-foreground text-center max-w-48">
                <p>
                  No courses added. Click{" "}
                  <span className="text-primary">+</span> to add one.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col min-h-20 gap-2 items-center justify-center text-muted-foreground text-center max-w-48">
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
