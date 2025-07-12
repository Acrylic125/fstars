"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type Program = {
  name: string;
  code: string;
  subCodes?: string[];
  years: number[];
};

const ALL_4_YEARS = [1, 2, 3, 4];
const ALL_3_YEARS = [1, 2, 3];
const ACAD_SEM = "2025;1";

const PROGRAMS: Program[] = [
  { name: "Computer Science", code: "CSC", years: ALL_4_YEARS },
  {
    name: "Data Science and Artificial Intelligence",
    code: "DSAI",
    years: ALL_4_YEARS,
  },
  { name: "Arts, Design and Media", code: "ADM", years: [1] },
  {
    name: "Arts, Design and Media",
    code: "ADM",
    subCodes: ["DA", "MA"],
    years: [2, 3, 4],
  },
];

const frameworks: {
  value: string;
  label: string;
}[] = generateCourseOptions(PROGRAMS);

function generateCourseOptions(sources: Program[]) {
  const options: {
    value: string;
    label: string;
  }[] = [];
  for (const source of sources) {
    for (const year of source.years) {
      if (source.subCodes) {
        for (const subCode of source.subCodes) {
          options.push({
            value: `${source.code}-${subCode}-${year}`,
            label: `${source.name} (${subCode}) Year ${year}`,
          });
        }
      } else {
        options.push({
          value: `${source.code}-${year}`,
          label: `${source.name} Year ${year}`,
        });
      }
    }
  }
  return options;
}

export function SelectProgramCombobox({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="flex-row w-full h-12 bg-input/30 border border-input rounded-md flex items-center justify-between px-3">
          <span
            className={cn(value ? "text-foreground" : "text-muted-foreground")}
          >
            {value ? value : "No Program Specified"}
          </span>
          <ChevronsUpDown className="opacity-50" />
        </div>
      </PopoverTrigger>
      {/* https://github.com/shadcn-ui/ui/issues/1690 */}
      <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]">
        <Command>
          <CommandInput
            placeholder="Search program..."
            className="h-10 text-base"
          />
          <CommandList>
            <CommandEmpty>No program found.</CommandEmpty>
            <CommandGroup>
              {frameworks.map((framework) => (
                <CommandItem
                  key={framework.value}
                  value={framework.label}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? null : currentValue);
                    setOpen(false);
                  }}
                >
                  {framework.label}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === framework.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
