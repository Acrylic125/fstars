"use client";

import * as React from "react";
import {
  ChevronsUpDown,
  CopyIcon,
  CopyPlusIcon,
  EllipsisIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandItemBase,
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
import { stopPropagation } from "@/lib/events";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

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
        deletePlan: state.deletePlan,
        changePlanName: state.changePlanName,
        createPlanCopy: state.createPlanCopy,
        createPlan: state.createPlan,
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
        <Command defaultValue="-">
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
                <CommandItemBase
                  key={plan.id}
                  value={plan.name}
                  onSelect={() => {
                    timetableStore?.changeTimetablePlan(timetableId, plan.id);
                  }}
                  selected={selectedPlan?.plan.id === plan.id}
                  className="group flex flex-row justify-between py-0"
                >
                  {plan.name}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={stopPropagation}
                        className="p-2.5 h-fit w-fit hover:group-data-[selected=true]:bg-transparent dark:hover:group-data-[selected=true]:bg-transparent hover:group-data-[selected=true]:text-neutral-400 dark:hover:group-data-[selected=true]:text-neutral-400"
                      >
                        <EllipsisIcon className="h-4 w-4 text-current" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onClick={() => {
                          timetableStore?.createPlanCopy({
                            timetableId,
                            planId: plan.id,
                          });
                        }}
                      >
                        <CopyIcon className="h-4 w-4" /> Create Copy
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => {
                          timetableStore?.deletePlan({
                            timetableId,
                            planId: plan.id,
                          });
                        }}
                      >
                        <TrashIcon className="h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CommandItemBase>
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
