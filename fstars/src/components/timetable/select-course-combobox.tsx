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
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
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
import { useMemo, useRef } from "react";
import Fuse from "fuse.js";
import { useVirtualizer } from "@tanstack/react-virtual";

const skeletons = Array.from({ length: 5 }, (_, i) => i);

export type RequestAddCourse = (
  course: inferRouterOutputs<AppRouter>["findCourses"][number]
) => void;

function SelectCourseCommand({
  programs,
  acadYear,
  timetableId,
  selectedPlanId,
  disabled,
}: {
  programs: Program[];
  acadYear: AcadYear;
  timetableId: TimetableId;
  selectedPlanId: PlanId;
  disabled?: boolean;
}) {
  const [phrase, setPhrase] = React.useState("");
  const [debouncedSearch] = useDebounce(phrase, 300);
  const utils = trpc.useUtils();

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
  const findCoursesRes = trpc.findAllCourses.useQuery(
    {
      acadYear,
    },
    {
      enabled: !disabled,
    }
  );

  const addCourseMutation = useMutation({
    mutationFn: async (courseCode: CourseCode) => {
      const res = await utils.client.getProgramExcludedCourseIndexes.query({
        courseCode,
        programs,
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
          ignoreIndexes: res,
        }
      );
      if (addCourseRes.type === "error") {
        throw new Error(addCourseRes.error);
      }
      return addCourseRes;
    },
  });

  const parentRef = useRef<HTMLDivElement>(null);

  const fuse = useMemo(() => {
    const courses = findCoursesRes.data ?? [];
    return new Fuse(courses, {
      keys: [
        {
          name: "code",
          weight: 2,
        },
        {
          name: "name",
          weight: 1,
        },
      ],
    });
  }, [findCoursesRes.data]);
  const filteredOptions = useMemo(() => {
    if (parentRef.current) {
      parentRef.current.scrollTo({
        top: 0,
        behavior: "instant",
      });
    }
    if (debouncedSearch === "") {
      return findCoursesRes.data ?? [];
    }
    return fuse.search(debouncedSearch).map((r) => r.item);
  }, [fuse, debouncedSearch, findCoursesRes.data]);

  const virtualizer = useVirtualizer({
    count: filteredOptions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36,
  });
  const virtualOptions = virtualizer.getVirtualItems();

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
    <Command shouldFilter={false}>
      <CommandInput
        placeholder="Search course..."
        className="h-10"
        onValueChange={setPhrase}
        value={phrase}
      />
      <CommandList
        ref={parentRef}
        style={{
          // height: `200px`,
          width: "100%",
          overflow: "auto",
        }}
      >
        <CommandEmpty>
          {findCoursesRes.isError ? (
            <div className="px-4">
              <Alert variant="error" className="flex flex-col gap-1 text-base">
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
        <CommandGroup
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {findCoursesRes.isLoading &&
            skeletons.map((i) => (
              <CommandItem key={i} className="animate-pulse">
                <Skeleton className="h-6 w-full" />
              </CommandItem>
            ))}
          {virtualOptions.map((virtualItem) => {
            const course = filteredOptions[virtualItem.index];
            const isSelected = timetableStore.planCourses?.has(course.code);
            return (
              <CommandItemBase
                key={course.id}
                value={course.name}
                disabled={
                  addCourseMutation.isPending ||
                  (!isSelected && hasReachedLimit)
                }
                style={{
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
                className="py-0 absolute top-0 left-0 right-0"
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
                <span className="flex flex-row items-center gap-2 min-w-0">
                  <span className="truncate">
                    {course.code} {course.name}
                  </span>
                  {course.exam ? (
                    <Badge variant="destructive" className="shrink-0">
                      Exam
                    </Badge>
                  ) : null}
                </span>
              </CommandItemBase>
            );
          })}
        </CommandGroup>
      </CommandList>
      <ScrollArea></ScrollArea>
      {errorEle.length > 0 && (
        <>
          <CommandSeparator />
          <div className="flex flex-row items-center justify-between px-2.5 py-4">
            {errorEle}
          </div>
        </>
      )}
    </Command>
  );
}

export function SelectCourseCombobox({
  programs,
  acadYear,
  timetableId,
  selectedPlanId,
  disabled,
}: {
  programs: Program[];
  acadYear: AcadYear;
  timetableId: TimetableId;
  selectedPlanId: PlanId;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="secondary" size="icon" disabled={disabled}>
          <PlusIcon className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      {/* https://github.com/shadcn-ui/ui/issues/1690 */}
      <PopoverContent className="p-0 w-md">
        <SelectCourseCommand
          programs={programs}
          acadYear={acadYear}
          timetableId={timetableId}
          selectedPlanId={selectedPlanId}
          disabled={disabled}
        />
      </PopoverContent>
    </Popover>
  );
}
