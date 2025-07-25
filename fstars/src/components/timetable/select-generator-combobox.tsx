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
import {
  TimetableGeneratorId,
  useTimetableGeneratorStore,
} from "./timetable-generator-store";

export function NewGeneratorDialogButton() {
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
      className="w-full flex flex-row items-center justify-start"
      onClick={(e) => {
        e.stopPropagation();
        modalStore.setAction({
          type: "create-generator",
          options: {},
        });
      }}
    >
      <PlusIcon className="h-4 w-4" />
      New Generator
    </Button>
  );
}

export function RenameGeneratorDialogButton({
  generatorRef,
  defaultName,
}: {
  generatorRef: TimetableGeneratorId;
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
          type: "rename-generator",
          options: {
            generatorRef,
            defaultName,
          },
        });
      }}
    >
      <PencilIcon className="h-4 w-4" /> Rename
    </DropdownMenuItem>
  );
}

export function SelectGeneratorCombobox() {
  const [open, setOpen] = useState(false);

  const modalStore = useTimetableModalStore(
    useShallow((state) => {
      return {
        setAction: state.setAction,
      };
    })
  );

  const generatorStore = useTimetableGeneratorStore(
    useShallow((state) => {
      return {
        selectedGeneratorId: state.selectedGeneratorId,
        generators: state.generators,
        selectedGenerator: state.generators.get(state.selectedGeneratorId),
        // deleteGenerator: state.deleteGenerator,
        createGeneratorCopy: state.createGeneratorCopy,
        changeGeneratorField: state.changeGeneratorField,
        changeSelectedGeneratorId: state.changeSelectedGeneratorId,
      };
    })
  );
  const generatorsArray = useMemo(() => {
    if (!generatorStore?.generators) return [];
    return Array.from(generatorStore.generators.values());
  }, [generatorStore?.generators]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "text-left flex flex-row items-center justify-between flex-1 px-2",
            generatorStore.generators ? "" : "text-muted-foreground"
          )}
        >
          {generatorStore.selectedGenerator
            ? generatorStore.selectedGenerator.name
            : "Select Generator"}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      {/* https://github.com/shadcn-ui/ui/issues/1690 */}
      <PopoverContent className="p-0 min-w-[var(--radix-popover-trigger-width)] max-w-sm">
        <Command defaultValue="-">
          <CommandInput placeholder="Search generator..." className="h-10" />
          <CommandList>
            <CommandEmpty>
              <div className="px-4 text-base py-4 text-muted-foreground mx-auto max-w-64">
                No generator found. Click{" "}
                <span className="font-semibold text-primary">
                  New Generator
                </span>{" "}
                to create a new generator.
              </div>
            </CommandEmpty>
            <CommandGroup>
              {generatorsArray.map((generator) => (
                <CommandItemBase
                  key={generator.id}
                  value={generator.name}
                  onSelect={() => {
                    generatorStore?.changeSelectedGeneratorId(generator.id);
                  }}
                  selected={generatorStore.selectedGeneratorId === generator.id}
                  className="group flex flex-row justify-between py-0"
                >
                  {generator.name}
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
                      <RenameGeneratorDialogButton
                        generatorRef={generator.id}
                        defaultName={generator.name}
                      />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          generatorStore?.createGeneratorCopy(generator.id);
                        }}
                      >
                        <CopyIcon className="h-4 w-4" /> Create Copy
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          modalStore.setAction({
                            type: "delete-generator-confirmation",
                            options: {
                              generatorRef: generator.id,
                            },
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
            <NewGeneratorDialogButton />
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
