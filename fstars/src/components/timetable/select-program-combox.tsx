"use client";

import * as React from "react";
import { ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItemBase,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Program } from "@/lib/types";
import { Button } from "../ui/button";
import { useMemo } from "react";

export function serializeProgram(program: Program) {
  return `${program.name}-${program.code}-${program.subCode}-${program.year}`;
}

export function toShortenedName(program: Program) {
  let name = program.code;
  if (program.subCode) {
    name += ` (${program.subCode})`;
  }
  if (program.year) {
    name += ` Year ${program.year}`;
  }
  return name;
}

export function toFullProgramName(program: Program) {
  let name = program.name;
  // if (program.subCode) {
  //   name += ` (${program.subCode})`;
  // }
  if (program.year) {
    name += ` Year ${program.year}`;
  }
  return name;
}

export function SelectProgramCombobox({
  value,
  onChange,
  programs,
}: {
  value: Program[];
  onChange: (value: Program) => void;
  programs: Program[];
}) {
  const [open, setOpen] = React.useState(false);
  const serializedPrograms = useMemo(() => {
    return value.map(serializeProgram);
  }, [value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="flex-row w-full h-12 border border-input rounded-md flex items-center justify-between px-3 truncate"
        >
          <span
            className={cn("flex flex-row gap-2", {
              "text-foreground": value.length > 0,
              "text-muted-foreground": value.length === 0,
            })}
          >
            {value.length > 0
              ? value.map((p, i) => (
                  <div
                    key={i}
                    className="rounded-sm bg-primary text-primary-foreground px-2 text-sm"
                  >
                    {toShortenedName(p)}
                  </div>
                ))
              : "No Program Specified"}
          </span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
        {/* <div className="flex-row w-full h-12 bg-input/30 border border-input rounded-md flex items-center justify-between px-3">
        </div> */}
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
              {programs.map((program) => {
                const serialized = serializeProgram(program);
                return (
                  <CommandItemBase
                    key={serialized}
                    value={serialized}
                    onSelect={() => {
                      onChange(program);
                    }}
                    selected={serializedPrograms.includes(serialized)}
                  >
                    {toFullProgramName(program)}
                  </CommandItemBase>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
