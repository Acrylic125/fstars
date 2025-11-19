"use client";
import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  createParser,
  parseAsArrayOf,
  parseAsString,
  useQueryState,
  useQueryStates,
} from "nuqs";
import { Config } from "@/lib/config";
import { TimetableView } from "./timetable-view";
import {
  ColorScheme,
  getColorMapForCourses,
  serializeCourseCodes,
  sortCourseCodes,
  useQueryParamCourses,
} from "./utils";
import { trpc } from "@/server/client";
import { inferRouterOutputs } from "@trpc/server";
import { AppRouter } from "@/server/router";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import {
  ChevronDownIcon,
  ChevronsUpDown,
  ChevronUpIcon,
  PlusIcon,
  TrashIcon,
} from "lucide-react";
import { Button } from "../ui/button";
import { useDebounce } from "use-debounce";
import { AcadYear } from "@/lib/types";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandItemBase,
  CommandSeparator,
} from "../ui/command";
import { ScrollArea } from "../ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Skeleton } from "../ui/skeleton";
import { cn } from "@/lib/utils";
import { Indicator, useIndicator } from "../ui/indicator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import Link from "next/link";

type Course = inferRouterOutputs<AppRouter>["findCourses"][number];

export function useQueryParamsAcadYear() {
  const [acadYear] = useQueryState(
    "acadYear",
    parseAsString.withDefault(Config.currentAcademicYear.yearCode)
  );
  const [semesterCode] = useQueryState(
    "sem",
    parseAsString.withDefault(`${Config.currentAcademicYear.semester}`)
  );
  return { acadYear, semesterCode };
}

export function TimetableSharedView() {
  const { acadYear, semesterCode } = useQueryParamsAcadYear();
  const [courseCodes] = useQueryParamCourses();

  return (
    <TimetableView
      courseCodes={courseCodes}
      acadYear={{ yearCode: acadYear, semesterCode: semesterCode }}
    />
  );
}

const skeletons = Array.from({ length: 5 }, (_, i) => i);

export type RequestAddCourse = (
  course: inferRouterOutputs<AppRouter>["findCourses"][number]
) => void;

export function SelectIndexCombobox({
  courseCode,
  acadYear,
  disabled,
}: {
  courseCode: string;
  acadYear: AcadYear;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const findIndexesRes = trpc.findCourseIndexes.useQuery(
    {
      phrase: "",
      courseCode,
      acadYear,
    },
    {
      enabled: !disabled && open,
    }
  );
  const indexOptions = findIndexesRes.data ?? [];
  const [courseCodes, setCourseCodes] = useQueryParamCourses();
  const courseIndex = useMemo(() => {
    const course = courseCodes.find((c) => c.courseCode === courseCode);
    if (!course) return "";
    return course.index;
  }, [courseCodes, courseCode]);
  const stopPropagation = useCallback((e: React.MouseEvent<unknown>) => {
    e.stopPropagation();
  }, []);

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
          <CommandInput placeholder="Search index..." className="h-10" />
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
            <CommandGroup className="max-h-72 overflow-y-auto">
              {findIndexesRes.isLoading &&
                skeletons.map((i) => (
                  <CommandItem key={i} className="animate-pulse">
                    <Skeleton className="h-6 w-full" />
                  </CommandItem>
                ))}
              {indexOptions.map((course, index) => (
                <CommandItem
                  key={course.id}
                  value={course.index}
                  className={cn("flex flex-row gap-2", {
                    "bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:bg-primary/90 data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground data-[selected=true]:hover:bg-primary/90 data-[selected=true]:focus-visible:bg-primary/90":
                      course.index === courseIndex,
                  })}
                  onSelect={(e) => {
                    setCourseCodes(
                      courseCodes.map((c) =>
                        c.courseCode === courseCode
                          ? { ...c, index: course.index }
                          : c
                      )
                    );
                  }}
                >
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

export function SelectCourseCombobox({ disabled }: { disabled?: boolean }) {
  const { acadYear, semesterCode } = useQueryParamsAcadYear();
  const [courseCodes, setCourseCodes] = useQueryParamCourses();
  const [open, setOpen] = useState(false);

  const [phrase, setPhrase] = useState("");
  const [debouncedPhrase] = useDebounce(phrase, 300);

  const findCoursesRes = trpc.findCourses.useQuery(
    {
      phrase: debouncedPhrase,
      acadYear: { yearCode: acadYear, semesterCode: semesterCode },
    },
    {
      enabled: !disabled,
    }
  );

  const courseOptions = findCoursesRes.data ?? [];

  const errorEle = [];
  let hasReachedLimit = false;
  if (courseCodes.length >= Config.limits.coursesInPlan) {
    hasReachedLimit = true;
    errorEle.push(
      <p className="text-destructive">
        Course limit reached ({courseCodes.length} /{" "}
        {Config.limits.coursesInPlan})
      </p>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="secondary" size="sm" disabled={disabled}>
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
                const isSelected = courseCodes.some(
                  (c) => c.courseCode === course.code
                );
                return (
                  <CommandItemBase
                    key={course.id}
                    value={course.name}
                    selected={isSelected}
                    disabled={!isSelected && hasReachedLimit}
                    onSelect={() => {
                      if (isSelected) {
                        setCourseCodes(
                          courseCodes.filter(
                            (c) => c.courseCode !== course.code
                          )
                        );
                      } else {
                        if (hasReachedLimit) {
                          return;
                        }
                        setCourseCodes([
                          ...courseCodes,
                          { courseCode: course.code, index: "" },
                        ]);
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

export function TimetableCoursesRow({
  color,
  courseCode,
  course,
  acadYear,
}: {
  color: string;
  courseCode: string;
  course?: Course;
  acadYear: AcadYear;
}) {
  const [courseCodes, setCourseCodes] = useQueryParamCourses();
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
            <SelectIndexCombobox courseCode={courseCode} acadYear={acadYear} />
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
                setCourseCodes(
                  courseCodes.filter((c) => c.courseCode !== courseCode)
                );
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

export function TimetableCoursesHeader() {
  const controls = useIndicator();
  const [courseCodes] = useQueryParamCourses();

  return (
    <div className="w-full h-fit flex flex-row items-center justify-between gap-2 px-4">
      <h2 className="text-base font-semibold">Select Courses</h2>
      <div className="flex flex-row gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline">
              Import
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem asChild>
              <Link href={`/new?c=${serializeCourseCodes(courseCodes)}`}>
                <div className="flex flex-col justify-center pr-8">
                  <p>Import to New Timetable</p>
                </div>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="relative">
          <Indicator controls={controls} />
          <Button
            size="sm"
            onClick={() => {
              controls.showIndicator(
                "Shareable Link Copied to clipboard!",
                "success"
              );
              const appUrl = window.location.origin;
              navigator.clipboard.writeText(
                `${appUrl}/preview?c=${serializeCourseCodes(courseCodes)}`
              );
            }}
          >
            Share
          </Button>
        </div>
        <SelectCourseCombobox disabled={false} />
      </div>
    </div>
  );
}

export function TimetableCoursesSharedPanel() {
  const { acadYear, semesterCode } = useQueryParamsAcadYear();
  const [courseCodes] = useQueryParamCourses();

  const selectedPlanCoursesArray = useMemo(() => {
    return sortCourseCodes(courseCodes.map((c) => c.courseCode));
  }, [courseCodes]);

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
  if (Object.keys(courseCodes).length <= 0) {
    ele = (
      <div className="text-base w-full flex flex-col min-h-36 gap-2 items-center justify-center text-muted-foreground text-center max-w-48">
        <p>
          No courses added. Click <span className="text-primary">+</span> to add
          one.
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
                color={colorMap.get(courseCode)?.backgroundColor ?? ""}
                courseCode={courseCode}
                course={course}
                acadYear={{ yearCode: acadYear, semesterCode: semesterCode }}
              />
            );
          })
        ) : (
          <div className="text-base w-full flex flex-col min-h-36 gap-2 items-center justify-center text-muted-foreground text-center max-w-48">
            <p>
              No courses added. Click <span className="text-primary">+</span> to
              add one.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full border border-border bg-card rounded-lg pt-4 pb-0 flex flex-col">
      <TimetableCoursesHeader />
      {/* <div className="flex flex-row gap-2 px-4">
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
      </div> */}
      <div className="flex flex-col w-full py-2 items-center">{ele}</div>
    </div>
  );
}
