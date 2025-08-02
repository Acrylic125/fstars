"use client";

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
import { useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useDebounce } from "use-debounce";
import Fuse from "fuse.js";

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

function SelectProgramCommand({
  value,
  onChange,
  programs,
  limit,
}: {
  value: Program[];
  onChange: (value: Program) => void;
  programs: Program[];
  limit: number;
}) {
  const serializedPrograms = useMemo(() => {
    return value.map(serializeProgram);
  }, [value]);

  const parentRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 300);

  const fuse = useMemo(() => {
    return new Fuse(programs, {
      keys: [
        {
          name: "name",
          weight: 1,
        },
        {
          name: "code",
          weight: 2,
        },
        {
          name: "subCode",
          weight: 2,
        },
        {
          name: "year",
          weight: 2,
        },
      ],
    });
  }, [programs]);

  const filteredOptions = useMemo(() => {
    if (parentRef.current) {
      parentRef.current.scrollTo({
        top: 0,
        behavior: "instant",
      });
    }
    if (debouncedSearch === "") {
      return programs;
    }
    return fuse.search(debouncedSearch).map((r) => r.item);
  }, [fuse, debouncedSearch, parentRef]);

  const virtualizer = useVirtualizer({
    count: filteredOptions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36,
  });

  const virtualOptions = virtualizer.getVirtualItems();

  return (
    <Command shouldFilter={false}>
      <CommandInput
        placeholder="Search program..."
        className="h-10 text-base"
        onValueChange={setSearch}
        ref={inputRef}
      />
      <CommandList
        ref={parentRef}
        style={{
          // height: `200px`,
          width: "100%",
          overflow: "auto",
        }}
      >
        <CommandEmpty>No program found.</CommandEmpty>
        <CommandGroup
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
          className="p-0"
        >
          {virtualOptions.map((virtualItem) => {
            const program = filteredOptions[virtualItem.index];
            const serialized = serializeProgram(program);
            const isSelected = serializedPrograms.includes(serialized);
            return (
              <CommandItemBase
                key={serialized}
                value={serialized}
                onSelect={() => {
                  onChange(program);
                  inputRef.current?.focus();
                }}
                style={{
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
                className="py-0 absolute top-0 left-0 right-0"
                selected={isSelected}
                disabled={!isSelected && value.length >= limit}
              >
                <div className="py-1.5 px-2 w-full">
                  {toFullProgramName(program)}
                </div>
              </CommandItemBase>
            );
          })}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

export function SelectProgramCombobox({
  value,
  onChange,
  programs,
  limit,
}: {
  value: Program[];
  onChange: (value: Program) => void;
  programs: Program[];
  limit: number;
}) {
  const [open, setOpen] = useState(false);

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
                    role="button"
                    className="rounded-xs bg-primary text-primary-foreground px-2 text-sm py-0 h-fit"
                    onClick={() => {
                      onChange(p);
                    }}
                  >
                    {toShortenedName(p)}
                  </div>
                ))
              : "No Program Specified"}
          </span>
          <div className="flex flex-row gap-2 items-center">
            {value.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {value.length} / {limit}
              </span>
            )}
            <ChevronsUpDown className="opacity-50" />
          </div>
        </Button>
        {/* <div className="flex-row w-full h-12 bg-input/30 border border-input rounded-md flex items-center justify-between px-3">
        </div> */}
      </PopoverTrigger>
      {/* https://github.com/shadcn-ui/ui/issues/1690 */}
      <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]">
        <SelectProgramCommand
          value={value}
          onChange={onChange}
          programs={programs}
          limit={limit}
        />
      </PopoverContent>
    </Popover>
  );
}
