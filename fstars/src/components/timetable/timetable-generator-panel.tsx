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
import { useCallback } from "react";
import { Collapsible, CollapsibleTrigger } from "@radix-ui/react-collapsible";
import { CollapsibleContent } from "../ui/collapsible";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

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
}: {
  selected: Priority;
  onChange: (selected: Priority) => void;
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
          <SelectItem key={option.value} value={option.value}>
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
              <p className="text-muted-foreground">{"< 1h"}</p>
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
              <p className="text-muted-foreground">1h - 2h</p>
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
              <p className="text-muted-foreground">2h - 3h</p>
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
              <p className="text-muted-foreground">3h - 4h</p>
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
              <p className="text-muted-foreground">{"> 4h"}</p>
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
