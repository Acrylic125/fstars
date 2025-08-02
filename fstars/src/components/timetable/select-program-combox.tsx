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

export function serializeProgram(program: Program) {
  return `${program.name}-${program.code}-${program.subCode}-${program.year}`;
}

export function toFullProgramName(program: Program) {
  let name = program.name;
  if (program.subCode) {
    name += ` (${program.subCode})`;
  }
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
  value: string | null;
  onChange: (value: Program | null) => void;
  programs: Program[];
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="flex-row w-full h-12 border border-input rounded-md flex items-center justify-between px-3"
        >
          <span
            className={cn(value ? "text-foreground" : "text-muted-foreground")}
          >
            {value ? value : "No Program Specified"}
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
                console.log(serialized, value);
                return (
                  <CommandItemBase
                    key={serialized}
                    value={serialized}
                    onSelect={() => {
                      onChange(program);
                      setOpen(false);
                    }}
                    selected={value === serialized}
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
