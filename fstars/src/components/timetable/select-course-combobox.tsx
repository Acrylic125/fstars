"use client";

import * as React from "react";
import { ChevronsUpDown, PlusIcon } from "lucide-react";
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
import { Button } from "../ui/button";
import { trpc } from "@/server/client";
import { useDebounce } from "use-debounce";

export function SelectCourseCombobox({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  const [open, setOpen] = React.useState(false);

  const [phrase, setPhrase] = React.useState("");
  const [debouncedPhrase] = useDebounce(phrase, 500);
  const findCoursesRes = trpc.findCourses.useQuery({
    phrase: debouncedPhrase,
  });

  const courseOptions = findCoursesRes.data ?? [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="secondary" size="icon">
          <PlusIcon className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      {/* https://github.com/shadcn-ui/ui/issues/1690 */}
      <PopoverContent className="p-0 w-md">
        <Command>
          <CommandInput placeholder="Search course..." className="h-10" />
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
