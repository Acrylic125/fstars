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
import {
  Plan,
  PlanId,
  TimetableId,
  useTimetableStore,
} from "./timetable-store";
import { Button } from "../ui/button";
import { useShallow } from "zustand/react/shallow";
import { useMemo } from "react";

export function SelectPlanCombobox({
  timetableId,
}: {
  timetableId: TimetableId;
}) {
  const [open, setOpen] = React.useState(false);

  const timetableStore = useTimetableStore(
    useShallow((state) => {
      const timetable = state.timetables.get(timetableId);
      if (!timetable) {
        return null;
      }

      return {
        plans: timetable.plans,
        selectedPlanId: timetable.selectedPlanId,
        changeTimetablePlan: state.changeTimetablePlan,
      };
    })
  );
  const selectedPlan = useMemo(() => {
    if (!timetableStore?.plans) return null;
    const plan = timetableStore.plans.get(timetableStore.selectedPlanId);
    if (!plan) return null;
    return { plan, courses: Array.from(plan.courses.keys()) };
  }, [timetableStore?.plans, timetableStore?.selectedPlanId]);
  const plansArray = useMemo(() => {
    if (!timetableStore?.plans) return [];
    return Array.from(timetableStore.plans.values());
  }, [timetableStore?.plans]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "text-left flex flex-row items-center justify-between flex-1 px-2",
            selectedPlan ? "" : "text-muted-foreground"
          )}
        >
          {selectedPlan ? selectedPlan.plan.name : "Select Plan"}
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
              {plansArray.map((plan) => (
                <CommandItem
                  key={plan.id}
                  value={plan.name}
                  onSelect={() => {
                    timetableStore?.changeTimetablePlan(timetableId, plan.id);
                    setOpen(false);
                  }}
                  className={cn(
                    selectedPlan?.plan.id === plan.id
                      ? "bg-primary text-primary-foreground active:bg-primary/90 hover:bg-primary/90 focus:bg-primary/90 data-[selected=true]:bg-primary/90 data-[selected=true]:text-primary-foreground"
                      : ""
                  )}
                >
                  {plan.name}
                </CommandItem>
              ))}
            </CommandGroup>
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
