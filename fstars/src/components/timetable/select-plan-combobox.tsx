"use client";

import {
  ChevronsUpDown,
  CopyIcon,
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
  TimetableId,
  TimetablePlanRef,
  useTimetableStore,
} from "./timetable-store";
import { Button } from "../ui/button";
import { useShallow } from "zustand/react/shallow";
import { useMemo, useState } from "react";
import { stopPropagation } from "@/lib/events";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useTimetableModalStore } from "./timetable-modal";
import { Config } from "@/lib/config";

export function NewPlanDialogButton({
  timetableId,
  errorMessage,
}: {
  timetableId: TimetableId;
  errorMessage?: string;
}) {
  const modalStore = useTimetableModalStore(
    useShallow((state) => {
      return {
        setAction: state.setAction,
      };
    })
  );

  return (
    <Button
      variant="ghost"
      className="w-full flex flex-row items-center justify-between group disabled:opacity-100 opacity-100 px-2"
      onClick={(e) => {
        e.stopPropagation();
        modalStore.setAction({
          type: "create-plan",
          options: {
            timetableId,
          },
        });
      }}
      disabled={!!errorMessage}
    >
      <span className="group-disabled:opacity-50 flex flex-row items-center gap-2">
        <PlusIcon className="h-4 w-4" />
        New Plan
      </span>
      {errorMessage && <span className="text-destructive">{errorMessage}</span>}
    </Button>
  );
}

export function RenamePlanDialogButton({
  planRef,
  defaultName,
}: {
  planRef: TimetablePlanRef;
  defaultName: string;
}) {
  const modalStore = useTimetableModalStore(
    useShallow((state) => {
      return {
        setAction: state.setAction,
      };
    })
  );
  return (
    <DropdownMenuItem
      onClick={(e) => {
        e.stopPropagation();
        modalStore.setAction({
          type: "rename-plan",
          options: {
            planRef,
            defaultName,
          },
        });
      }}
    >
      <PencilIcon className="h-4 w-4" /> Rename
    </DropdownMenuItem>
  );
}

export function SelectPlanCombobox({
  timetableId,
}: {
  timetableId: TimetableId;
}) {
  const [open, setOpen] = useState(false);

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

  let ele = null;
  let hasReachedLimit = false;
  if (timetableStore) {
    hasReachedLimit = timetableStore.plans.size >= Config.limits.plans;
    ele = plansArray.map((plan) => (
      <CommandItemBase
        key={plan.id}
        value={plan.name}
        onSelect={() => {
          timetableStore.changeTimetablePlan(timetableId, plan.id);
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
            <RenamePlanDialogButton
              planRef={{
                timetableId,
                planId: plan.id,
              }}
              defaultName={plan.name}
            />
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                timetableStore.createPlanCopy({
                  timetableId,
                  planId: plan.id,
                });
              }}
              disabled={hasReachedLimit}
              className="data-[disabled]:opacity-100 opacity-100 group flex flex-row"
            >
              <span className="group-data-[disabled]:opacity-50 flex flex-row items-center gap-2">
                <CopyIcon className="h-4 w-4" /> Create Copy
              </span>
              {hasReachedLimit && (
                <span className="text-destructive">
                  Plan limit reached{" "}
                  {`(${timetableStore.plans.size} / ${Config.limits.plans})`}
                </span>
              )}
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation();
                timetableStore.deletePlan({
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
    ));
  }

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
              <div className="px-4 text-base py-4 text-muted-foreground mx-auto max-w-64">
                No plan found. Click{" "}
                <span className="font-semibold text-primary">New Plan</span> to
                create a new plan.
              </div>
            </CommandEmpty>
            <CommandGroup>{ele}</CommandGroup>
          </CommandList>
          <CommandSeparator />
          <div className="flex flex-row items-center justify-between pb-1">
            <NewPlanDialogButton
              timetableId={timetableId}
              errorMessage={
                hasReachedLimit && timetableStore
                  ? `Plan limit reached (${timetableStore.plans.size} / ${Config.limits.plans})`
                  : undefined
              }
            />
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
