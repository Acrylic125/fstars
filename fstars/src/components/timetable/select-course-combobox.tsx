"use client";

import * as React from "react";
import { PlusIcon } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
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
      timetableStore.addCourseToPlan(
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
      return res;
    },
  });

  const courseOptions = findCoursesRes.data ?? [];

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
              {courseOptions.map((course) => (
                <CommandItem
                  key={course.id}
                  value={course.name}
                  onSelect={() => {
                    setOpen(false);
                    addCourseMutation.mutate(course.code);
                  }}
                >
                  {course.code} {course.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </ScrollArea>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
