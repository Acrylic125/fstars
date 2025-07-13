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
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Plan, PlanId, Program } from "./timetable-store";
import { Button } from "../ui/button";

export function SelectPlanCombobox({
  value,
  onChange,
  plans,
}: {
  value: Plan | null;
  onChange: (value: Plan | null) => void;
  plans: Plan[];
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "text-left flex flex-row items-center justify-between flex-1 px-2",
            value ? "" : "text-muted-foreground"
          )}
        >
          {value ? value.name : "Select Plan"}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      {/* https://github.com/shadcn-ui/ui/issues/1690 */}
      <PopoverContent className="p-0 min-w-[var(--radix-popover-trigger-width)] max-w-sm">
        <Command>
          <CommandInput placeholder="Search plan..." className="h-10" />
          <CommandList>
            <CommandEmpty>
              <div className="px-4 text-muted-foreground">
                No plan found. Click{" "}
                <span className="font-semibold text-primary">New Plan</span> to
                create a new plan.
              </div>
            </CommandEmpty>
            <CommandGroup>
              {plans.map((plan) => (
                <CommandItem
                  key={plan.id}
                  value={plan.name}
                  onSelect={() => {
                    onChange(plan);
                    setOpen(false);
                  }}
                  className={cn(
                    value?.id === plan.id
                      ? "bg-primary text-primary-foreground active:bg-primary/90 hover:bg-primary/90 focus:bg-primary/90 data-[selected=true]:bg-primary/90 data-[selected=true]:text-primary-foreground"
                      : ""
                  )}
                >
                  {plan.name}
                </CommandItem>
              ))}
            </CommandGroup>
            {/* <CommandSeparator /> */}
            {/* <CommandGroup>
              <CommandItem>
                <PlusIcon className="h-4 w-4" />
                New Plan
              </CommandItem>
            </CommandGroup> */}
          </CommandList>
          <CommandSeparator />
          <div className="flex flex-row items-center justify-between pb-1">
            <Button
              variant="ghost"
              className="w-full flex flex-row items-center justify-start"
            >
              <PlusIcon className="h-4 w-4" />
              New Plan
            </Button>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
