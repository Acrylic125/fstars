"use client";

import * as React from "react";
import { ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
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
import { Program } from "./timetable-store";

type AvailableProgram = {
  name: string;
  code: string;
  subCodes?: string[];
  years: number[];
};

const ALL_4_YEARS = [1, 2, 3, 4];
const ALL_3_YEARS = [1, 2, 3];
const ACAD_SEM = "2025;1";

const AVAILABLE_PROGRAMS: AvailableProgram[] = [
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

type ProgramOption = {
  label: string;
  program: Program;
};

const programOptions: ProgramOption[] = generateOptions(AVAILABLE_PROGRAMS);

function generateOptions(sources: AvailableProgram[]) {
  const options: ProgramOption[] = [];
  for (const source of sources) {
    for (const year of source.years) {
      if (source.subCodes) {
        for (const subCode of source.subCodes) {
          const program: Program = {
            code: source.code,
            name: source.name,
            year: year,
            subCode: subCode,
          };
          options.push({
            label: asProgramName(program),
            program: program,
          });
        }
      } else {
        const program: Program = {
          code: source.code,
          name: source.name,
          year: year,
        };
        options.push({
          label: asProgramName(program),
          program: program,
        });
      }
    }
  }
  return options;
}

export type ProgramName = string;

export function asProgramName(program: Program): ProgramName {
  if (program.subCode) {
    return `${program.name} (${program.subCode}) Year ${program.year}`;
  } else {
    return `${program.name} Year ${program.year}`;
  }
}

export function SelectProgramCombobox({
  value,
  onChange,
}: {
  value: ProgramName | null;
  onChange: (value: Program | null) => void;
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
              {programOptions.map((program) => (
                <CommandItem
                  key={program.label}
                  value={program.label}
                  onSelect={() => {
                    onChange(program.program);
                    setOpen(false);
                  }}
                  className={cn(
                    value === program.label
                      ? "bg-primary text-primary-foreground active:bg-primary/90 hover:bg-primary/90 focus:bg-primary/90 data-[selected=true]:bg-primary/90 data-[selected=true]:text-primary-foreground"
                      : ""
                  )}
                >
                  {program.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
