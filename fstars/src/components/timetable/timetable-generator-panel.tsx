"use client";
import { useShallow } from "zustand/react/shallow";
import {
  asPriority,
  asPriorityNumber,
  Priority,
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

  return (
    <div className="h-12 w-full flex flex-row justify-between items-center px-4">
      <p className="text-sm">No class days</p>
      <SelectPriority
        selected={asPriority(generatorStore?.noClassDays.priority)}
        onChange={(selected) => {
          generatorStore?.changeGeneratorField(generatorId, "noClassDays", {
            priority: asPriorityNumber(selected),
          });
        }}
      />
    </div>
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
