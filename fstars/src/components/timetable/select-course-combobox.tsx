"use client";

import * as React from "react";
import { PlusIcon } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandItemBase,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "../ui/button";
import { trpc } from "@/server/client";
import { useDebounce } from "use-debounce";
import { ScrollArea } from "../ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Skeleton } from "../ui/skeleton";
import { AcadYear, Program } from "@/lib/types";
import { inferRouterOutputs } from "@trpc/server";
import { type AppRouter } from "@/server/router";
import {
  CourseCode,
  PlanId,
  TimetableId,
  useTimetableStore,
} from "./timetable-store";
import { useShallow } from "zustand/react/shallow";
import { useMutation } from "@tanstack/react-query";
import { Config } from "@/lib/config";

const skeletons = Array.from({ length: 5 }, (_, i) => i);

export type RequestAddCourse = (
  course: inferRouterOutputs<AppRouter>["findCourses"][number]
) => void;

export function SelectCourseCombobox({
  program,
  acadYear,
  timetableId,
  selectedPlanId,
  disabled,
}: {
  program: Program;
  acadYear: AcadYear;
  timetableId: TimetableId;
  selectedPlanId: PlanId;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);

  const [phrase, setPhrase] = React.useState("");
  const [debouncedPhrase] = useDebounce(phrase, 300);
  const utils = trpc.useUtils();

  const findCoursesRes = trpc.findCourses.useQuery(
    {
      phrase: debouncedPhrase,
      program,
      acadYear,
    },
    {
      enabled: !disabled,
    }
  );

  const timetableStore = useTimetableStore(
    useShallow((state) => {
      return {
        addCourseToPlan: state.addCourseToPlan,
        removeCourseFromPlan: state.removeCourseFromPlan,
        planCourses: state.timetables
          .get(timetableId)
          ?.plans.get(selectedPlanId)?.courses,
      };
    })
  );

  const addCourseMutation = useMutation({
    mutationFn: async (courseCode: CourseCode) => {
      const res = await utils.client.getProgramExcludedCourseIndexes.query({
        courseCode,
        program,
        acadYear,
      });
      const addCourseRes = timetableStore.addCourseToPlan(
        {
          timetableId,
          planId: selectedPlanId,
        },
        {
          code: courseCode,
          index: "",
          ignoreIndexes: res.map((r) => r.index),
        }
      );
      if (addCourseRes.type === "error") {
        throw new Error(addCourseRes.error);
      }
      return addCourseRes;
    },
  });

  const courseOptions = findCoursesRes.data ?? [];

  const errorEle = [];
  let hasReachedLimit = false;
  if (timetableStore.planCourses) {
    hasReachedLimit =
      timetableStore.planCourses.size >= Config.limits.coursesInPlan;
    if (hasReachedLimit) {
      errorEle.push(
        <p className="text-destructive">
          Course limit reached ({timetableStore.planCourses.size} /{" "}
          {Config.limits.coursesInPlan})
        </p>
      );
    }
  }
  if (addCourseMutation.error) {
    errorEle.push(
      <Alert variant="error">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{addCourseMutation.error.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="secondary" size="icon" disabled={disabled}>
          <PlusIcon className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      {/* https://github.com/shadcn-ui/ui/issues/1690 */}
      <PopoverContent className="p-0 w-md">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search course..."
            className="h-10"
            onValueChange={setPhrase}
            value={phrase}
          />
          <ScrollArea>
            <CommandEmpty>
              {findCoursesRes.isError ? (
                <div className="px-4">
                  <Alert
                    variant="error"
                    className="flex flex-col gap-1 text-base"
                  >
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                      {findCoursesRes.error.message}
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <div className="px-4 text-base py-4 text-muted-foreground mx-auto max-w-64">
                  No course found.
                </div>
              )}
            </CommandEmpty>
            <CommandGroup className="max-h-72 overflow-y-auto">
              {findCoursesRes.isLoading &&
                skeletons.map((i) => (
                  <CommandItem key={i} className="animate-pulse">
                    <Skeleton className="h-6 w-full" />
                  </CommandItem>
                ))}
              {courseOptions.map((course) => {
                const isSelected = timetableStore.planCourses?.has(course.code);
                return (
                  <CommandItemBase
                    key={course.id}
                    value={course.name}
                    disabled={
                      addCourseMutation.isPending ||
                      (!isSelected && hasReachedLimit)
                    }
                    selected={isSelected}
                    onSelect={() => {
                      if (isSelected) {
                        timetableStore.removeCourseFromPlan({
                          timetableId,
                          planId: selectedPlanId,
                          courseCode: course.code,
                        });
                      } else {
                        addCourseMutation.mutate(course.code);
                      }
                    }}
                  >
                    {course.code} {course.name}
                  </CommandItemBase>
                );
              })}
            </CommandGroup>
          </ScrollArea>
          {errorEle.length > 0 && (
            <>
              <CommandSeparator />
              <div className="flex flex-row items-center justify-between px-2.5 py-4">
                {errorEle}
              </div>
            </>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
