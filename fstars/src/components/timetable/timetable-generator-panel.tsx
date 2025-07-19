"use client";
import { useShallow } from "zustand/react/shallow";
import {
  asPriority,
  asPriorityNumber,
  Priority,
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
import { SelectGeneratorCombobox } from "./select-generator-combobox";
import { useCallback, useEffect, useRef } from "react";
import { Collapsible, CollapsibleTrigger } from "@radix-ui/react-collapsible";
import { CollapsibleContent } from "../ui/collapsible";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { Input } from "../ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "../ui/button";
import { CommandItemBase } from "../ui/command";
import { cn } from "@/lib/utils";
import EvenDistributionIcon from "../icons/even-distribution";
import SkewedDistributionIcon from "../icons/skewed-distribution";

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

export function NoClassDaysFactorView({
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
        noClassDays: generator.factors.noClassDays,
      };
    })
  );
  const changeSelection = useCallback(
    (selected: Priority) => {
      generatorStore?.changeGeneratorField(generatorId, "noClassDays", {
        priority: asPriorityNumber(selected),
      });
    },
    [generatorStore, generatorId]
  );

  return (
    <div className="h-12 w-full flex flex-row justify-between items-center px-4">
      <p className="text-sm">No class days</p>
      <SelectPriority
        selected={asPriority(generatorStore?.noClassDays.priority)}
        onChange={changeSelection}
      />
    </div>
  );
}

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
            <div className="flex flex-row justify-between items-center">
              <p className="text-muted-foreground text-sm">{"< 1h"}</p>
              <SelectPriority
                selected={asPriority(
                  generatorStore.consecutiveClasses.before1.priority
                )}
                onChange={(value) => {
                  changeSelection({
                    ...generatorStore.consecutiveClasses,
                    before1: {
                      priority: asPriorityNumber(value),
                    },
                  });
                }}
              />
            </div>
            <div className="flex flex-row justify-between items-center">
              <p className="text-muted-foreground text-sm">1h - 2h</p>
              <SelectPriority
                selected={asPriority(
                  generatorStore.consecutiveClasses.between1hAnd2h.priority
                )}
                onChange={(value) => {
                  changeSelection({
                    ...generatorStore.consecutiveClasses,
                    between1hAnd2h: {
                      priority: asPriorityNumber(value),
                    },
                  });
                }}
              />
            </div>
            <div className="flex flex-row justify-between items-center">
              <p className="text-muted-foreground text-sm">2h - 3h</p>
              <SelectPriority
                selected={asPriority(
                  generatorStore.consecutiveClasses.between2hAnd3h.priority
                )}
                onChange={(value) => {
                  changeSelection({
                    ...generatorStore.consecutiveClasses,
                    between2hAnd3h: {
                      priority: asPriorityNumber(value),
                    },
                  });
                }}
              />
            </div>
            <div className="flex flex-row justify-between items-center">
              <p className="text-muted-foreground text-sm">3h - 4h</p>
              <SelectPriority
                selected={asPriority(
                  generatorStore.consecutiveClasses.between3hAnd4h.priority
                )}
                onChange={(value) => {
                  changeSelection({
                    ...generatorStore.consecutiveClasses,
                    between3hAnd4h: {
                      priority: asPriorityNumber(value),
                    },
                  });
                }}
              />
            </div>
            <div className="flex flex-row justify-between items-center">
              <p className="text-muted-foreground text-sm">{"> 4h"}</p>
              <SelectPriority
                selected={asPriority(
                  generatorStore.consecutiveClasses.after4h.priority
                )}
                onChange={(value) => {
                  changeSelection({
                    ...generatorStore.consecutiveClasses,
                    after4h: {
                      priority: asPriorityNumber(value),
                    },
                  });
                }}
              />
            </div>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

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
            <div className="flex flex-row justify-between items-center">
              <p className="text-muted-foreground text-sm">{"< 1h"}</p>
              <SelectPriority
                selected={asPriority(
                  generatorStore.gapsBetweenClasses.before1.priority
                )}
                onChange={(value) => {
                  changeSelection({
                    ...generatorStore.gapsBetweenClasses,
                    before1: {
                      priority: asPriorityNumber(value),
                    },
                  });
                }}
              />
            </div>
            <div className="flex flex-row justify-between items-center">
              <p className="text-muted-foreground text-sm">1h - 2h</p>
              <SelectPriority
                selected={asPriority(
                  generatorStore.gapsBetweenClasses.between1hAnd2h.priority
                )}
                onChange={(value) => {
                  changeSelection({
                    ...generatorStore.gapsBetweenClasses,
                    between1hAnd2h: {
                      priority: asPriorityNumber(value),
                    },
                  });
                }}
              />
            </div>
            <div className="flex flex-row justify-between items-center">
              <p className="text-muted-foreground text-sm">2h - 3h</p>
              <SelectPriority
                selected={asPriority(
                  generatorStore.gapsBetweenClasses.between2hAnd3h.priority
                )}
                onChange={(value) => {
                  changeSelection({
                    ...generatorStore.gapsBetweenClasses,
                    between2hAnd3h: {
                      priority: asPriorityNumber(value),
                    },
                  });
                }}
              />
            </div>
            <div className="flex flex-row justify-between items-center">
              <p className="text-muted-foreground text-sm">3h - 4h</p>
              <SelectPriority
                selected={asPriority(
                  generatorStore.gapsBetweenClasses.between3hAnd4h.priority
                )}
                onChange={(value) => {
                  changeSelection({
                    ...generatorStore.gapsBetweenClasses,
                    between3hAnd4h: {
                      priority: asPriorityNumber(value),
                    },
                  });
                }}
              />
            </div>
            <div className="flex flex-row justify-between items-center">
              <p className="text-muted-foreground text-sm">{"> 4h"}</p>
              <SelectPriority
                selected={asPriority(
                  generatorStore.gapsBetweenClasses.after4h.priority
                )}
                onChange={(value) => {
                  changeSelection({
                    ...generatorStore.gapsBetweenClasses,
                    after4h: {
                      priority: asPriorityNumber(value),
                    },
                  });
                }}
              />
            </div>
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
}: {
  hours: number;
  minutes: number;
  onChange: (value: { hours: number; minutes: number }) => void;
}) {
  //   const hoursRef = useRef<HTMLButtonElement>(null);
  //   const minutesRef = useRef<HTMLButtonElement>(null);

  //   useEffect(() => {
  //     if (hoursRef.current) {
  //       hoursRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
  //     }
  //   }, [hours]);
  //   useEffect(() => {
  //     if (minutesRef.current) {
  //       minutesRef.current.scrollIntoView({
  //         behavior: "smooth",
  //         block: "center",
  //       });
  //     }
  //   }, [minutes]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-16">
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

export function TimetableGeneratorPanel() {
  const generatorStore = useTimetableGeneratorStore(
    useShallow((state) => {
      return {
        selectedGeneratorId: state.selectedGeneratorId,
        selectedGenerator: state.generators.get(state.selectedGeneratorId),
      };
    })
  );

  return (
    <div className="w-full border border-border bg-card rounded-lg pt-4 pb-0 flex flex-col">
      <h2 className="text-base font-semibold px-4 pb-2">Generator</h2>
      <div className="flex flex-row gap-2 px-4">
        <SelectGeneratorCombobox />
      </div>
      <div className="flex flex-col w-full py-2 items-center">
        {generatorStore?.selectedGenerator ? (
          <>
            <NoClassDaysFactorView
              generatorId={generatorStore.selectedGeneratorId}
            />
            <ConsecutiveClassesFactorView
              generatorId={generatorStore.selectedGeneratorId}
            />
            <GapsBetweenClassesFactorView
              generatorId={generatorStore.selectedGeneratorId}
            />
            <StartAfterTimeView
              generatorId={generatorStore.selectedGeneratorId}
            />
            <ClassDistributionView
              generatorId={generatorStore.selectedGeneratorId}
            />
          </>
        ) : (
          <div className="text-base w-full flex flex-col min-h-36 gap-2 items-center justify-center text-muted-foreground text-center max-w-48">
            <p>
              No generator selected. Click{" "}
              <span className="text-primary">Select Generator</span> to select
              one.
            </p>
          </div>
        )}
        {/* <NoClassDaysFactorView />
        <NoClassDaysFactorView />
        <NoClassDaysFactorView />
        <NoClassDaysFactorView />
        <NoClassDaysFactorView />
        <NoClassDaysFactorView />
        <NoClassDaysFactorView />
        <NoClassDaysFactorView /> */}
      </div>
    </div>
  );
}
