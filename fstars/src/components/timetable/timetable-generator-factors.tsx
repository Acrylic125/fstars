"use client";
import { useShallow } from "zustand/react/shallow";
import {
  TimetableGenerator,
  TimetableGeneratorId,
  useTimetableGeneratorStore,
} from "./timetable-generator-store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { useCallback } from "react";
import { Collapsible, CollapsibleTrigger } from "@radix-ui/react-collapsible";
import { CollapsibleContent } from "../ui/collapsible";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import EvenDistributionIcon from "../icons/even-distribution";
import SkewedDistributionIcon from "../icons/skewed-distribution";
import { Alert, AlertTitle } from "../ui/alert";
import { isBeforeOrEqual } from "@/generator/utils";
import { asPriority, asPriorityNumber, Priority } from "./utils";

const priorityOptions: {
  value: Priority;
  label: string;
  colorClassName: string;
}[] = [
  { value: "None", label: "Not Used", colorClassName: "bg-secondary" },
  {
    value: "Not Preferred",
    label: "Not Preferred",
    colorClassName: "bg-red-300",
  },
  { value: "Preferred", label: "Preferred", colorClassName: "bg-yellow-300" },
  { value: "Important", label: "Important", colorClassName: "bg-green-300" },
];

export function SelectPriority({
  selected,
  onChange,
  disablePriorities,
}: {
  selected: Priority;
  onChange: (selected: Priority) => void;
  disablePriorities?: Priority[];
}) {
  const selectedOption = priorityOptions.find(
    (option) => option.value === selected
  );
  return (
    <Select value={selected} onValueChange={onChange}>
      <SelectTrigger className="gap-1 flex flex-row">
        <div className="flex flex-row gap-2 items-center">
          <div
            className={`w-3 h-3 rounded-full ${selectedOption?.colorClassName}`}
          />
          <p className="w-24 text-left truncate">{selectedOption?.label}</p>
        </div>
      </SelectTrigger>
      <SelectContent>
        {priorityOptions.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            disabled={disablePriorities?.includes(option.value)}
          >
            <div className="flex flex-row gap-2 items-center">
              <div
                className={`w-3 h-3 rounded-full ${option.colorClassName}`}
              />
              <p>{option.label}</p>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const dayDurationOptions: {
  value: keyof TimetableGenerator["factors"]["dayDuration"];
  label: string;
}[] = [
  { value: "noClass", label: "No class" },
  { value: "below2h", label: "< 2h" },
  { value: "between2hAnd4h", label: "2h - 4h" },
  { value: "between4hAnd6h", label: "4h - 6h" },
  { value: "between6hAnd8h", label: "6h - 8h" },
  { value: "above8h", label: "After 8h" },
];

export function DayDurationFactorView({
  generatorId,
}: {
  generatorId: TimetableGeneratorId;
}) {
  const generatorStore = useTimetableGeneratorStore(
    useShallow((state) => {
      const generator = state.generators.get(generatorId);
      if (!generator) return null;
      return {
        changeGeneratorField: state.changeGeneratorField,
        dayDuration: generator.factors.dayDuration,
      };
    })
  );
  const changeSelection = useCallback(
    (value: TimetableGenerator["factors"]["dayDuration"]) => {
      generatorStore?.changeGeneratorField(generatorId, "dayDuration", value);
    },
    [generatorStore, generatorId]
  );

  return (
    <Collapsible className="group/collapsible w-full">
      <CollapsibleTrigger asChild>
        <div
          role="button"
          tabIndex={0}
          aria-label="Consecutive classes"
          className="h-12 w-full flex flex-row justify-between items-center px-4 hover:bg-neutral-100 focus-visible:bg-neutral-100 dark:hover:bg-neutral-800 dark:focus-visible:bg-neutral-800 outline-0 ring-0 cursor-pointer [&_svg]:pointer-events-none select-none"
        >
          <p className="text-sm">Consecutive classes</p>
          <div className="text-muted-foreground hidden lg:block">
            <ChevronDownIcon className="w-4 h-4 group-data-[state=open]/collapsible:hidden" />
            <ChevronUpIcon className="w-4 h-4 group-data-[state=closed]/collapsible:hidden" />
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {generatorStore?.dayDuration && (
          <div className="flex flex-col gap-2 px-4 py-2">
            {dayDurationOptions.map((option) => (
              <div
                className="flex flex-row justify-between items-center"
                key={option.value}
              >
                <p className="text-muted-foreground text-sm">{option.label}</p>
                <SelectPriority
                  selected={asPriority(
                    generatorStore.dayDuration[option.value].priority
                  )}
                  onChange={(value) => {
                    changeSelection({
                      ...generatorStore.dayDuration,
                      [option.value]: {
                        priority: asPriorityNumber(value),
                      },
                    });
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

// export function NoClassDaysFactorView({
//   generatorId,
// }: {
//   generatorId: TimetableGeneratorId;
// }) {
//   const generatorStore = useTimetableGeneratorStore(
//     useShallow((state) => {
//       const generator = state.generators.get(generatorId);
//       if (!generator) return null;
//       return {
//         changeGeneratorField: state.changeGeneratorField,
//         noClassDays: generator.factors.noClassDays,
//       };
//     })
//   );
//   const changeSelection = useCallback(
//     (selected: Priority) => {
//       generatorStore?.changeGeneratorField(generatorId, "noClassDays", {
//         priority: asPriorityNumber(selected),
//       });
//     },
//     [generatorStore, generatorId]
//   );

//   return (
//     <div className="h-12 w-full flex flex-row justify-between items-center px-4">
//       <p className="text-sm">No class days</p>
//       <SelectPriority
//         selected={asPriority(generatorStore?.noClassDays.priority)}
//         onChange={changeSelection}
//       />
//     </div>
//   );
// }

const consecutiveClassesOptions: {
  value: keyof TimetableGenerator["factors"]["consecutiveClasses"];
  label: string;
}[] = [
  { value: "before1h", label: "< 1h" },
  { value: "between1hAnd2h", label: "1h - 2h" },
  { value: "between2hAnd3h", label: "2h - 3h" },
  { value: "between3hAnd4h", label: "3h - 4h" },
  { value: "after4h", label: "After 4h" },
];

export function ConsecutiveClassesFactorView({
  generatorId,
}: {
  generatorId: TimetableGeneratorId;
}) {
  const generatorStore = useTimetableGeneratorStore(
    useShallow((state) => {
      const generator = state.generators.get(generatorId);
      if (!generator) return null;
      return {
        changeGeneratorField: state.changeGeneratorField,
        consecutiveClasses: generator.factors.consecutiveClasses,
      };
    })
  );
  const changeSelection = useCallback(
    (value: TimetableGenerator["factors"]["consecutiveClasses"]) => {
      generatorStore?.changeGeneratorField(
        generatorId,
        "consecutiveClasses",
        value
      );
    },
    [generatorStore, generatorId]
  );

  return (
    <Collapsible className="group/collapsible w-full">
      <CollapsibleTrigger asChild>
        <div
          role="button"
          tabIndex={0}
          aria-label="Consecutive classes"
          className="h-12 w-full flex flex-row justify-between items-center px-4 hover:bg-neutral-100 focus-visible:bg-neutral-100 dark:hover:bg-neutral-800 dark:focus-visible:bg-neutral-800 outline-0 ring-0 cursor-pointer [&_svg]:pointer-events-none select-none"
        >
          <p className="text-sm">Consecutive classes</p>
          <div className="text-muted-foreground hidden lg:block">
            <ChevronDownIcon className="w-4 h-4 group-data-[state=open]/collapsible:hidden" />
            <ChevronUpIcon className="w-4 h-4 group-data-[state=closed]/collapsible:hidden" />
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {generatorStore?.consecutiveClasses && (
          <div className="flex flex-col gap-2 px-4 py-2">
            {consecutiveClassesOptions.map((option) => (
              <div
                className="flex flex-row justify-between items-center"
                key={option.value}
              >
                <p className="text-muted-foreground text-sm">{option.label}</p>
                <SelectPriority
                  selected={asPriority(
                    generatorStore.consecutiveClasses[option.value].priority
                  )}
                  onChange={(value) => {
                    changeSelection({
                      ...generatorStore.consecutiveClasses,
                      [option.value]: {
                        priority: asPriorityNumber(value),
                      },
                    });
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

const gapsBetweenClassesOptions: {
  value: keyof TimetableGenerator["factors"]["gapsBetweenClasses"];
  label: string;
}[] = [
  { value: "before1h", label: "< 1h" },
  { value: "between1hAnd2h", label: "1h - 2h" },
  { value: "between2hAnd3h", label: "2h - 3h" },
  { value: "between3hAnd4h", label: "3h - 4h" },
  { value: "after4h", label: "After 4h" },
];

export function GapsBetweenClassesFactorView({
  generatorId,
}: {
  generatorId: TimetableGeneratorId;
}) {
  const generatorStore = useTimetableGeneratorStore(
    useShallow((state) => {
      const generator = state.generators.get(generatorId);
      if (!generator) return null;
      return {
        changeGeneratorField: state.changeGeneratorField,
        gapsBetweenClasses: generator.factors.gapsBetweenClasses,
      };
    })
  );
  const changeSelection = useCallback(
    (value: TimetableGenerator["factors"]["gapsBetweenClasses"]) => {
      generatorStore?.changeGeneratorField(
        generatorId,
        "gapsBetweenClasses",
        value
      );
    },
    [generatorStore, generatorId]
  );

  return (
    <Collapsible className="group/collapsible w-full">
      <CollapsibleTrigger asChild>
        <div
          role="button"
          tabIndex={0}
          aria-label="Gaps between classes"
          className="h-12 w-full flex flex-row justify-between items-center px-4 hover:bg-neutral-100 focus-visible:bg-neutral-100 dark:hover:bg-neutral-800 dark:focus-visible:bg-neutral-800 outline-0 ring-0 cursor-pointer [&_svg]:pointer-events-none select-none"
        >
          <p className="text-sm">Gaps between classes</p>
          <div className="text-muted-foreground hidden lg:block">
            <ChevronDownIcon className="w-4 h-4 group-data-[state=open]/collapsible:hidden" />
            <ChevronUpIcon className="w-4 h-4 group-data-[state=closed]/collapsible:hidden" />
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {generatorStore?.gapsBetweenClasses && (
          <div className="flex flex-col gap-2 px-4 py-2">
            {gapsBetweenClassesOptions.map((option) => (
              <div
                className="flex flex-row justify-between items-center"
                key={option.value}
              >
                <p className="text-muted-foreground text-sm">{option.label}</p>
                <SelectPriority
                  selected={asPriority(
                    generatorStore.gapsBetweenClasses[option.value].priority
                  )}
                  onChange={(value) => {
                    changeSelection({
                      ...generatorStore.gapsBetweenClasses,
                      [option.value]: {
                        priority: asPriorityNumber(value),
                      },
                    });
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

function HHMMTimePickerInput({
  hours,
  minutes,
  onChange,
  isError,
}: {
  hours: number;
  minutes: number;
  onChange: (value: { hours: number; minutes: number }) => void;
  isError?: boolean;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-16", {
            "border-destructive text-destructive dark:border-destructive dark:text-destructive":
              isError,
          })}
        >
          {`${hours.toString().padStart(2, "0")} : ${minutes.toString().padStart(2, "0")}`}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-48 flex flex-col">
        <div className="flex flex-row gap-2 items-center border-b border-border">
          <p className="flex-1 text-muted-foreground text-sm text-center border-r border-border py-2">
            Hours
          </p>
          <p className="flex-1 text-muted-foreground text-sm text-center">
            Minutes
          </p>
        </div>
        <div className="flex flex-row gap-2 items-center">
          <div className="flex-1 flex flex-col max-h-48 overflow-y-auto border-r border-border">
            {new Array(24).fill(0).map((_, index) => {
              const isSelected = index === hours;
              return (
                <Button
                  //   ref={isSelected ? hoursRef : null}
                  key={index}
                  className={cn(
                    "w-full text-foreground bg-transparent hover:bg-accent focus:bg-accent relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
                    {
                      "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90":
                        isSelected,
                    }
                  )}
                  onClick={() => onChange({ hours: index, minutes })}
                >
                  {index.toString().padStart(2, "0")}
                </Button>
              );
            })}
          </div>
          <div className="flex-1 flex flex-col max-h-48 overflow-y-auto">
            {new Array(12).fill(0).map((_, index) => {
              const isSelected = index * 5 === minutes;
              return (
                <Button
                  //   ref={isSelected ? minutesRef : null}
                  key={index}
                  className={cn(
                    "w-full text-foreground bg-transparent hover:bg-accent focus:bg-accent relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
                    {
                      "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90":
                        isSelected,
                    }
                  )}
                  onClick={() => onChange({ hours, minutes: index * 5 })}
                >
                  {(index * 5).toString().padStart(2, "0")}
                </Button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function StartAfterTimeView({
  generatorId,
}: {
  generatorId: TimetableGeneratorId;
}) {
  const generatorStore = useTimetableGeneratorStore(
    useShallow((state) => {
      const generator = state.generators.get(generatorId);
      if (!generator) return null;
      return {
        changeGeneratorField: state.changeGeneratorField,
        startAfterAndEndBefore: generator.factors.startAfterAndEndBefore,
      };
    })
  );
  const changeSelection = useCallback(
    (value: TimetableGenerator["factors"]["startAfterAndEndBefore"]) => {
      generatorStore?.changeGeneratorField(
        generatorId,
        "startAfterAndEndBefore",
        value
      );
    },
    [generatorStore, generatorId]
  );

  const isStartAfterBeforeEnd =
    generatorStore &&
    isBeforeOrEqual(
      generatorStore.startAfterAndEndBefore.startAfter,
      generatorStore.startAfterAndEndBefore.endBefore
    );

  return (
    <Collapsible className="group/collapsible w-full">
      <CollapsibleTrigger asChild>
        <div
          role="button"
          tabIndex={0}
          aria-label="Start after and end before"
          className="h-12 w-full flex flex-row justify-between items-center px-4 hover:bg-neutral-100 focus-visible:bg-neutral-100 dark:hover:bg-neutral-800 dark:focus-visible:bg-neutral-800 outline-0 ring-0 cursor-pointer [&_svg]:pointer-events-none select-none"
        >
          <p className="text-sm">Start after and End before</p>
          <div className="text-muted-foreground hidden lg:block">
            <ChevronDownIcon className="w-4 h-4 group-data-[state=open]/collapsible:hidden" />
            <ChevronUpIcon className="w-4 h-4 group-data-[state=closed]/collapsible:hidden" />
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {generatorStore?.startAfterAndEndBefore && (
          <div className="flex flex-col gap-2 px-4 py-2">
            <div className="flex flex-row justify-between items-center gap-2">
              <p className="text-muted-foreground text-sm">Start after</p>
              <div className="flex flex-row gap-2 items-center">
                <HHMMTimePickerInput
                  hours={generatorStore.startAfterAndEndBefore.startAfter.hour}
                  minutes={
                    generatorStore.startAfterAndEndBefore.startAfter.minute
                  }
                  onChange={(value) => {
                    changeSelection({
                      ...generatorStore.startAfterAndEndBefore,
                      startAfter: {
                        ...generatorStore.startAfterAndEndBefore.startAfter,
                        hour: value.hours,
                        minute: value.minutes,
                      },
                    });
                  }}
                  isError={!isStartAfterBeforeEnd}
                />
                <SelectPriority
                  selected={asPriority(
                    generatorStore.startAfterAndEndBefore.startAfter.priority
                  )}
                  onChange={(value) => {
                    changeSelection({
                      ...generatorStore.startAfterAndEndBefore,
                      startAfter: {
                        ...generatorStore.startAfterAndEndBefore.startAfter,
                        priority: asPriorityNumber(value),
                      },
                    });
                  }}
                  disablePriorities={["Not Preferred"]}
                />
              </div>
            </div>
            <div className="flex flex-row justify-between items-center gap-2">
              <p className="text-muted-foreground text-sm">End before</p>
              <div className="flex flex-row gap-2 items-center">
                <HHMMTimePickerInput
                  hours={generatorStore.startAfterAndEndBefore.endBefore.hour}
                  minutes={
                    generatorStore.startAfterAndEndBefore.endBefore.minute
                  }
                  onChange={(value) => {
                    changeSelection({
                      ...generatorStore.startAfterAndEndBefore,
                      endBefore: {
                        ...generatorStore.startAfterAndEndBefore.endBefore,
                        hour: value.hours,
                        minute: value.minutes,
                      },
                    });
                  }}
                  isError={!isStartAfterBeforeEnd}
                />
                <SelectPriority
                  selected={asPriority(
                    generatorStore.startAfterAndEndBefore.endBefore.priority
                  )}
                  onChange={(value) => {
                    changeSelection({
                      ...generatorStore.startAfterAndEndBefore,
                      endBefore: {
                        ...generatorStore.startAfterAndEndBefore.endBefore,
                        priority: asPriorityNumber(value),
                      },
                    });
                  }}
                  disablePriorities={["Not Preferred"]}
                />
              </div>
            </div>
            {!isStartAfterBeforeEnd && (
              <Alert variant="error">
                <AlertTitle>
                  <p>
                    <span className="font-bold">Error:</span> Start time is
                    after end time.
                  </p>
                </AlertTitle>
              </Alert>
            )}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function ClassDistributionView({
  generatorId,
}: {
  generatorId: TimetableGeneratorId;
}) {
  const generatorStore = useTimetableGeneratorStore(
    useShallow((state) => {
      const generator = state.generators.get(generatorId);
      if (!generator) return null;
      return {
        changeGeneratorField: state.changeGeneratorField,
        classDistribution: generator.factors.classDistribution,
      };
    })
  );
  const changeSelection = useCallback(
    (value: TimetableGenerator["factors"]["classDistribution"]) => {
      generatorStore?.changeGeneratorField(
        generatorId,
        "classDistribution",
        value
      );
    },
    [generatorStore, generatorId]
  );

  return (
    <Collapsible className="group/collapsible w-full">
      <CollapsibleTrigger asChild>
        <div
          role="button"
          tabIndex={0}
          aria-label="Start after and end before"
          className="h-12 w-full flex flex-row justify-between items-center px-4 hover:bg-neutral-100 focus-visible:bg-neutral-100 dark:hover:bg-neutral-800 dark:focus-visible:bg-neutral-800 outline-0 ring-0 cursor-pointer [&_svg]:pointer-events-none select-none"
        >
          <p className="text-sm">Class Distribution</p>
          <div className="text-muted-foreground hidden lg:block">
            <ChevronDownIcon className="w-4 h-4 group-data-[state=open]/collapsible:hidden" />
            <ChevronUpIcon className="w-4 h-4 group-data-[state=closed]/collapsible:hidden" />
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {generatorStore?.classDistribution && (
          <div className="flex flex-col gap-2 px-4 py-2 w-full">
            <div className="flex flex-row justify-between items-center gap-2 w-full">
              <div className="flex flex-row gap-2 items-center w-full">
                <Select
                  value={generatorStore.classDistribution.distribution}
                  onValueChange={(value) => {
                    changeSelection({
                      ...generatorStore.classDistribution,
                      distribution: value as "Even" | "Skewed",
                    });
                  }}
                >
                  <SelectTrigger className="w-full gap-1 flex flex-row">
                    <div className="w-full flex flex-row gap-2 items-center">
                      {generatorStore.classDistribution.distribution ===
                        "Even" && (
                        <>
                          <EvenDistributionIcon className="w-full h-full stroke-white" />
                          <p className="w-24 text-left truncate">Even</p>
                        </>
                      )}
                      {generatorStore.classDistribution.distribution ===
                        "Skewed" && (
                        <>
                          <SkewedDistributionIcon className="w-full h-full stroke-white" />
                          <p className="w-24 text-left truncate">Skewed</p>
                        </>
                      )}
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Even">
                      <div className="flex flex-row gap-2 items-center">
                        <EvenDistributionIcon className="w-full h-full stroke-white" />
                        <p className="w-24 text-left truncate">Even</p>
                      </div>
                    </SelectItem>
                    <SelectItem value="Skewed">
                      <div className="flex flex-row gap-2 items-center">
                        <SkewedDistributionIcon className="w-full h-full stroke-white" />
                        <p className="w-24 text-left truncate">Skewed</p>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <SelectPriority
                  selected={asPriority(
                    generatorStore.classDistribution.priority
                  )}
                  onChange={(value) => {
                    changeSelection({
                      ...generatorStore.classDistribution,
                      priority: asPriorityNumber(value),
                    });
                  }}
                  disablePriorities={["Not Preferred"]}
                />
              </div>
            </div>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
