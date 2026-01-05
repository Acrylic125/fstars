"use client";

import { ChevronsUpDown } from "lucide-react";
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
import { AcadYear } from "@/lib/types";
import { PlanId, TimetableId, useTimetableStore } from "./timetable-store";
import { Checkbox } from "../ui/checkbox";
import { useShallow } from "zustand/react/shallow";
import { useEffect, useMemo, useRef, useState } from "react";
import { stopPropagation } from "@/lib/events";
import { cn } from "@/lib/utils";
import { useDebounce } from "use-debounce";

const skeletons = Array.from({ length: 5 }, (_, i) => i);

export function SelectIndexCombobox({
  courseCode,
  acadYear,
  timetableId,
  planId,
  disabled,
}: {
  courseCode: string;
  acadYear: AcadYear;
  timetableId: TimetableId;
  planId: PlanId;
  disabled?: boolean;
}) {
  const timetableStore = useTimetableStore(
    useShallow((state) => {
      const timetable = state.timetables.get(timetableId);
      if (!timetable) {
        return null;
      }
      const plan = timetable.plans.get(planId);
      const course = plan?.courses.get(courseCode);
      return {
        courseInfo: course,
        plan: plan,
        toggleIgnoreIndexes: state.toggleIgnoreIndexes,
        selectCourseIndex: state.selectCourseIndex,
      };
    })
  );
  const [open, setOpen] = useState(false);
  const findIndexesRes = trpc.findCourseIndexes.useQuery(
    {
      courseCode,
      acadYear,
    },
    {
      enabled: !disabled && open,
    }
  );
  const indexOptions = findIndexesRes.data ?? [];
  const lastCheckedCheckboxIndexesRef = useRef<{
    index: number;
    checked: boolean;
  } | null>(null);
  const isShiftDownRef = useRef<boolean>(false);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      isShiftDownRef.current = e.shiftKey;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      isShiftDownRef.current = false;
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);
  const courseIndex = useMemo(() => {
    const plan = timetableStore?.plan;
    if (!plan) return "";
    const course = plan.courses.get(courseCode);
    if (!course) return "";
    return course.index;
  }, [timetableStore?.plan]);

  const parentRef = useRef<HTMLDivElement>(null);
  // const inputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 300);

  const filteredOptions = useMemo(() => {
    if (parentRef.current) {
      parentRef.current.scrollTo({
        top: 0,
        behavior: "instant",
      });
    }
    if (debouncedSearch === "") {
      return indexOptions;
    }
    return indexOptions.filter((option) =>
      option.index.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [debouncedSearch, indexOptions, parentRef]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="col-span-2 flex flex-row gap-2 px-2 items-center justify-start overflow-ellipsis whitespace-nowrap break-words text-muted-foreground"
          onClick={stopPropagation}
        >
          <div className="truncate w-full text-left">
            {courseIndex ? courseIndex : "Not Selected"}
          </div>
          <ChevronsUpDown />
        </Button>
      </PopoverTrigger>
      {/* https://github.com/shadcn-ui/ui/issues/1690 */}
      <PopoverContent className="p-0 w-xs" onClick={stopPropagation}>
        <Command>
          <CommandInput
            placeholder="Search index..."
            className="h-10"
            onValueChange={setSearch}
          />
          <ScrollArea>
            <CommandEmpty>
              {findIndexesRes.isError ? (
                <div className="px-4">
                  <Alert
                    variant="error"
                    className="flex flex-col gap-1 text-base"
                  >
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                      {findIndexesRes.error.message}
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <div className="px-4 text-base py-4 text-muted-foreground mx-auto max-w-64">
                  No course index found.
                </div>
              )}
            </CommandEmpty>
            <CommandGroup className="max-h-72 overflow-y-auto" ref={parentRef}>
              {findIndexesRes.isLoading &&
                skeletons.map((i) => (
                  <CommandItem key={i} className="animate-pulse">
                    <Skeleton className="h-6 w-full" />
                  </CommandItem>
                ))}
              {filteredOptions.map((course, index) => (
                <CommandItem
                  key={course.id}
                  value={course.index}
                  className={cn("flex flex-row gap-2", {
                    "bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:bg-primary/90 data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground data-[selected=true]:hover:bg-primary/90 data-[selected=true]:focus-visible:bg-primary/90":
                      course.index === courseIndex,
                  })}
                  onSelect={(e) => {
                    timetableStore?.selectCourseIndex(
                      {
                        timetableId,
                        planId,
                        courseCode,
                      },
                      course.index
                    );
                  }}
                >
                  <Checkbox
                    checked={
                      !timetableStore?.courseInfo?.ignoreIndexes.has(
                        course.index
                      )
                    }
                    className={cn({
                      "dark:bg-neutral-800": course.index === courseIndex,
                    })}
                    onClick={stopPropagation}
                    onCheckedChange={(_checked) => {
                      const checked = _checked === true;
                      const lastChecked = lastCheckedCheckboxIndexesRef.current;
                      if (lastChecked !== null && isShiftDownRef.current) {
                        const loIndex = Math.min(index, lastChecked.index);
                        const hiIndex = Math.max(index, lastChecked.index);
                        const indexesToToggle = indexOptions
                          .slice(loIndex, hiIndex + 1)
                          .map((i) => i.index);
                        timetableStore?.toggleIgnoreIndexes(
                          {
                            timetableId,
                            planId,
                            courseCode,
                          },
                          indexesToToggle,
                          !checked
                        );
                        return;
                      }
                      lastCheckedCheckboxIndexesRef.current = {
                        index,
                        checked,
                      };
                      timetableStore?.toggleIgnoreIndexes(
                        {
                          timetableId,
                          planId,
                          courseCode,
                        },
                        [course.index],
                        !checked
                      );
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
