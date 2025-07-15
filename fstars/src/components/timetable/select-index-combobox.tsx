"use client";

import * as React from "react";
import { ChevronsUpDown, PlusIcon } from "lucide-react";
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
import { ScrollArea } from "../ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Skeleton } from "../ui/skeleton";
import { AcadYear, Program } from "@/lib/types";
import { PlanId, TimetableId } from "./timetable-store";
import { Checkbox } from "../ui/checkbox";

const skeletons = Array.from({ length: 5 }, (_, i) => i);

// export type RequestAddCourse = (
//   index: inferRouterOutputs<AppRouter>["findCourseIndexes"][number]
// ) => void;

export function SelectIndexCombobox({
  courseCode,
  acadYear,
  // requestAddCourse,
  timetableId,
  planId,
  disabled,
  courseIndex,
}: {
  courseCode: string;
  acadYear: AcadYear;
  timetableId: TimetableId;
  planId: PlanId;
  // requestAddCourse?: RequestAddCourse;
  disabled?: boolean;
  courseIndex?: string;
}) {
  const [open, setOpen] = React.useState(false);

  const findCoursesRes = trpc.findCourseIndexes.useQuery(
    {
      phrase: "",
      courseCode,
      acadYear,
    },
    {
      enabled: !disabled && open,
    }
  );

  const indexOptions = findCoursesRes.data ?? [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="col-span-2 flex flex-row gap-2 px-2 items-center justify-start overflow-ellipsis whitespace-nowrap break-words text-muted-foreground"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          {courseIndex ? courseIndex : "Not Selected"}
          <ChevronsUpDown />
        </Button>
      </PopoverTrigger>
      {/* https://github.com/shadcn-ui/ui/issues/1690 */}
      <PopoverContent
        className="p-0 w-xs"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <Command>
          <CommandInput placeholder="Search index..." className="h-10" />
          <ScrollArea>
            <CommandEmpty>
              {findCoursesRes.isError ? (
                <div className="px-4">
                  <Alert variant="error" className="flex flex-col gap-1">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                      {findCoursesRes.error.message}
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                "No course found"
              )}
            </CommandEmpty>
            <CommandGroup className="max-h-72 overflow-y-auto">
              {findCoursesRes.isLoading &&
                skeletons.map((i) => (
                  <CommandItem key={i} className="animate-pulse">
                    <Skeleton className="h-6 w-full" />
                  </CommandItem>
                ))}
              {indexOptions.map((course) => (
                <CommandItem
                  key={course.id}
                  value={course.index}
                  onSelect={(e) => {
                    // setOpen(false);
                    // requestAddCourse?.(course);
                  }}
                >
                  <Checkbox
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  />
                  <div className="flex-1">{course.index}</div>
                </CommandItem>
              ))}
            </CommandGroup>
          </ScrollArea>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
