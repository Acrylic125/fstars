"use client";
import { useShallow } from "zustand/react/shallow";
import { PlanId, useTimetableStore } from "./timetable-store";
import { Skeleton } from "../ui/skeleton";
import { useCallback, useMemo } from "react";
import { SelectPlanCombobox } from "./select-plan-combobox";
import { SelectCourseCombobox } from "./select-course-combobox";
import { trpc } from "@/server/client";
import { Button } from "../ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  EditIcon,
  TrashIcon,
} from "lucide-react";
import { ColorScheme, getColorMapForCourses, sortCourseCodes } from "./utils";
import { SelectIndexCombobox } from "./select-index-combobox";
import { type AppRouter } from "@/server/router";
import { inferRouterOutputs } from "@trpc/server";
import { AcadYear } from "@/lib/types";
import { Indicator, useIndicator } from "../ui/indicator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useTimetableModalStore } from "./timetable-modal";
import { serializePlanCourses } from "./timetable-importer-utils";
import {
  downloadObjectAsJSONFile,
  exportTimetable,
} from "./timetable-export-utils";
import { nanoid } from "nanoid";
import { useTimetableGeneratorStore } from "./timetable-generator-store";
import Link from "next/link";

export function TimetableHeader({ id }: { id: string }) {
  const timetable = useTimetableStore(
    useShallow((state) => {
      const timetable = state.timetables.get(id);
      if (!timetable) {
        return null;
      }
      return {
        name: timetable.name,
        programs: timetable.programs,
        acadYear: timetable.acadYear,
      };
    })
  );
  const controls = useIndicator();

  const exportTimetableFile = useCallback(() => {
    if (!timetable) {
      return;
    }
    const timetableState = useTimetableStore.getState().timetables.get(id);
    if (!timetableState) {
      return;
    }
    const generators = useTimetableGeneratorStore.getState().generators;
    const json = exportTimetable({
      version: 1,
      timetables: new Map([[id, timetableState]]),
      generators,
    });
    const filename = `${timetable.name} ${nanoid(8)}.json`;
    downloadObjectAsJSONFile(json, filename);
    controls.showIndicator(`Exported ${filename} to downloads!`, "success");
  }, [timetable, id]);

  return (
    <div className="w-full flex flex-row gap-2 justify-between items-center">
      <div className="w-full flex flex-row items-center gap-4">
        <div className="flex flex-col">
          {timetable !== null ? (
            <>
              <p className="text-sm text-muted-foreground h-6">
                {/* {timetable.program.name} - AY */}
                AY{
                  timetable.acadYear.yearCode
                } Semester {timetable.acadYear.semesterCode}
              </p>
              <div className="flex flex-row items-center">
                <h1 className="text-2xl font-semibold h-12">
                  {timetable.name}
                </h1>
              </div>
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
        <Button variant="outline" size="icon" asChild>
          <Link href={`/timetable/${id}/edit`}>
            <EditIcon className="w-4 h-4" />
          </Link>
        </Button>
      </div>

      <div className="flex flex-row gap-2">
        <div className="relative flex flex-row gap-2">
          <Indicator controls={controls} className="w-48 z-10" />
          <Button variant="default" onClick={exportTimetableFile}>
            Export
          </Button>
        </div>
      </div>
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

export function TimetableCoursePlansHeader({ id }: { id: string }) {
  const controls = useIndicator();
  const selectedPlan = useTimetableStore(
    useShallow((state) => {
      const timetable = state.timetables.get(id);
      if (!timetable) {
        return null;
      }
      return timetable.plans.get(timetable.selectedPlanId);
    })
  );
  const modalStore = useTimetableModalStore(
    useShallow((state) => {
      return {
        setAction: state.setAction,
      };
    })
  );

  return (
    <div className="w-full h-fit flex flex-row items-center justify-between gap-2 px-4 pb-4">
      <h2 className="text-base font-semibold">1. Select Courses</h2>
      <div className="flex flex-row gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" disabled={!selectedPlan} variant="outline">
              Import
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onClick={() => {
                if (!selectedPlan) {
                  return;
                }
                modalStore.setAction({
                  type: "import-plan",
                  options: {
                    type: "current",
                    planRef: {
                      timetableId: id,
                      planId: selectedPlan.id,
                    },
                  },
                });
              }}
            >
              <div className="flex flex-col justify-center pr-8">
                <p>Import to Current Plan</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                modalStore.setAction({
                  type: "import-plan",
                  options: {
                    type: "new",
                    timetableId: id,
                  },
                });
              }}
            >
              <div className="flex flex-col justify-center pr-8">
                <p>Import to New Plan</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                if (!selectedPlan) {
                  return;
                }
                modalStore.setAction({
                  type: "import-plan",
                  options: {
                    type: "copy",
                    planRef: {
                      timetableId: id,
                      planId: selectedPlan.id,
                    },
                  },
                });
              }}
            >
              <div className="flex flex-col justify-center pr-8">
                <p>Import to Copy of Current Plan</p>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="relative">
          <Indicator controls={controls} />
          <Button
            size="sm"
            disabled={!selectedPlan}
            onClick={() => {
              if (!selectedPlan) {
                return;
              }
              controls.showIndicator("Copied to clipboard!", "success");
              navigator.clipboard.writeText(
                serializePlanCourses(selectedPlan.courses)
              );
            }}
          >
            Share
          </Button>
        </div>
      </div>
    </div>
  );
}

export function TimetableCoursesPanel({ id }: { id: string }) {
  const timetableStore = useTimetableStore(
    useShallow((state) => {
      const timetable = state.timetables.get(id);
      if (!timetable) {
        return null;
      }

      const plan = timetable.plans.get(timetable.selectedPlanId);

      return {
        programs: timetable.programs,
        acadYear: timetable.acadYear,
        plans: timetable.plans,
        selectedPlanId: timetable.selectedPlanId,
        selectedPlanCourses: plan?.courses ?? null,
      };
    })
  );

  const selectedPlanCoursesArray = useMemo(() => {
    if (!timetableStore?.selectedPlanCourses) return [];
    return sortCourseCodes(
      Array.from(timetableStore.selectedPlanCourses.keys())
    );
  }, [timetableStore?.selectedPlanCourses]);

  const selectedPlanCourses = trpc.getCoursesByCodes.useQuery(
    {
      codes: selectedPlanCoursesArray,
    },
    {
      enabled:
        !!selectedPlanCoursesArray && selectedPlanCoursesArray.length > 0,
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

  const colorScheme: ColorScheme = "default";
  const colorMap = useMemo(() => {
    return getColorMapForCourses(selectedPlanCoursesArray, colorScheme);
  }, [selectedPlanCoursesArray, colorScheme]);

  let ele;
  if (timetableStore) {
    if (
      timetableStore.plans.size <= 0 ||
      !timetableStore.selectedPlanId ||
      timetableStore.selectedPlanCourses === null
    ) {
      ele = (
        <div className="text-base w-full flex flex-col min-h-36 gap-2 items-center justify-center text-muted-foreground text-center max-w-48">
          <p>
            No plan selected. Click{" "}
            <span className="text-primary">Select Plan</span> to select one.
            plan.
          </p>
        </div>
      );
    } else if (timetableStore.selectedPlanCourses.size <= 0) {
      ele = (
        <div className="text-base w-full flex flex-col min-h-36 gap-2 items-center justify-center text-muted-foreground text-center max-w-48">
          <p>
            No courses added. Click <span className="text-primary">+</span> to
            add one.
          </p>
        </div>
      );
    } else {
      ele = (
        <div className="flex flex-col w-full py-2 items-center">
          {selectedPlanCoursesArray.length > 0 ? (
            selectedPlanCoursesArray.map((courseCode, index) => {
              const course = selectedPlanCoursesMap.get(courseCode);
              return (
                <TimetableCoursesRow
                  key={courseCode}
                  id={id}
                  color={colorMap.get(courseCode)?.backgroundColor ?? ""}
                  planId={timetableStore.selectedPlanId}
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
            <div className="text-base w-full flex flex-col min-h-36 gap-2 items-center justify-center text-muted-foreground text-center max-w-48">
              <p>
                No courses added. Click <span className="text-primary">+</span>{" "}
                to add one.
              </p>
            </div>
          )}
        </div>
      );
    }
  } else {
    ele = <></>;
  }

  return (
    <div className="w-full border border-border bg-card rounded-lg pt-4 pb-0 flex flex-col">
      <TimetableCoursePlansHeader id={id} />
      <div className="flex flex-row gap-2 px-4">
        <SelectPlanCombobox timetableId={id} />
        {timetableStore && timetableStore.selectedPlanId ? (
          <SelectCourseCombobox
            programs={timetableStore.programs}
            acadYear={timetableStore.acadYear}
            timetableId={id}
            selectedPlanId={timetableStore.selectedPlanId}
          />
        ) : (
          <SelectCourseCombobox
            programs={[]}
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
      <div className="flex flex-col w-full py-2 items-center">{ele}</div>
    </div>
  );
}
