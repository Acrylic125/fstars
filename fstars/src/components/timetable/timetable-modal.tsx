"use client";
import { create } from "zustand";
import {
  Timetable,
  TimetableId,
  TimetablePlanRef,
  useTimetableStore,
} from "./timetable-store";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { useShallow } from "zustand/react/shallow";
import { useCallback, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "../ui/button";
import {
  AlertCircleIcon,
  ArrowRightLeftIcon,
  CheckCircleIcon,
  XIcon,
} from "lucide-react";
import { nanoid } from "nanoid";
import {
  GeneratorTemplateTypeSchema,
  TimetableGeneratorId,
  useTimetableGeneratorStore,
} from "./timetable-generator-store";
import { cn } from "@/lib/utils";
import { Textarea } from "../ui/textarea";
import { ScrollArea } from "../ui/scroll-area";
import { deserializePlanCourses } from "./timetable-importer-utils";
import { trpc } from "@/server/client";

export type TimetableModalAction =
  | {
      type: "create-plan";
      options: {
        timetableId: TimetableId;
      };
    }
  | {
      type: "rename-plan";
      options: {
        planRef: TimetablePlanRef;
        defaultName: string;
      };
    }
  | {
      type: "create-generator";
      options: {};
    }
  | {
      type: "rename-generator";
      options: {
        generatorRef: TimetableGeneratorId;
        defaultName: string;
      };
    }
  | {
      type: "delete-generator-confirmation";
      options: {
        generatorRef: TimetableGeneratorId;
      };
    }
  | {
      type: "import-plan";
      options:
        | {
            type: "current" | "copy";
            planRef: TimetablePlanRef;
          }
        | {
            type: "new";
            timetableId: TimetableId;
          };
    };

type ExtractOptions<T extends TimetableModalAction["type"]> = Extract<
  TimetableModalAction,
  { type: T }
>["options"];

type TimetableModalStore = {
  action:
    | ({
        key: string;
      } & TimetableModalAction)
    | null;
  setAction: (
    action: TimetableModalAction | null,
    refreshKey?: boolean
  ) => void;
};

export const useTimetableModalStore = create<TimetableModalStore>(
  (set, get) => ({
    action: null,
    setAction: (action, refreshKey = true) => {
      if (action === null) {
        return set({
          action: null,
        });
      }
      const curKey = get().action?.key;
      if (refreshKey && curKey) {
        return set({
          action: {
            ...action,
            key: curKey,
          },
        });
      }
      return set({
        action: {
          ...action,
          key: nanoid(16),
        },
      });
    },
  })
);

const NewPlanFormSchema = z.object({
  name: z.string().min(1, "Please enter a plan name"),
});

export function NewPlanDialog({
  options,
  isOpen,
  setIsOpen,
}: {
  options?: ExtractOptions<"create-plan">;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}) {
  const form = useForm<z.infer<typeof NewPlanFormSchema>>({
    resolver: zodResolver(NewPlanFormSchema),
    defaultValues: {
      name: "New Plan",
    },
  });
  const timetableStore = useTimetableStore(
    useShallow((state) => {
      return {
        createPlan: state.createPlan,
      };
    })
  );

  // We will use RQ to do state management despite the action being synchronous.
  const createPlanMutation = useMutation({
    mutationFn: async (data: z.infer<typeof NewPlanFormSchema>) => {
      if (!options) {
        return;
      }
      const res = timetableStore?.createPlan(
        {
          timetableId: options.timetableId,
        },
        data.name
      );
      if (res.type === "success") {
        setIsOpen(false);
      } else {
        throw new Error(res.error);
      }
    },
  });

  const onSubmit = (data: z.infer<typeof NewPlanFormSchema>) => {
    createPlanMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Plan</DialogTitle>
          <DialogDescription>
            Create a new plan for this timetable.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter timetable name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {createPlanMutation.isError && (
              <Alert variant="error">
                <AlertCircleIcon />
                <AlertTitle>Unable to create timetable.</AlertTitle>
                <AlertDescription>
                  <p>{createPlanMutation.error.message}</p>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={createPlanMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createPlanMutation.isPending}>
                {createPlanMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

const RenamePlanFormSchema = z.object({
  name: z.string().min(1, "Please enter a plan name"),
});

export function RenamePlanDialog({
  options,
  isOpen,
  setIsOpen,
}: {
  options?: ExtractOptions<"rename-plan">;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}) {
  const form = useForm<z.infer<typeof RenamePlanFormSchema>>({
    resolver: zodResolver(RenamePlanFormSchema),
    defaultValues: {
      name: options?.defaultName ?? "",
    },
  });
  const timetableStore = useTimetableStore(
    useShallow((state) => {
      return {
        changePlanName: state.changePlanName,
      };
    })
  );

  // We will use RQ to do state management despite the action being synchronous.
  const createPlanMutation = useMutation({
    mutationFn: async (data: z.infer<typeof RenamePlanFormSchema>) => {
      if (!options) {
        return;
      }
      const { planRef } = options;
      timetableStore?.changePlanName(planRef, data.name);
    },
  });

  const onSubmit = (data: z.infer<typeof RenamePlanFormSchema>) => {
    createPlanMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Plan</DialogTitle>
          <DialogDescription>
            Create a new plan for this timetable.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter timetable name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {createPlanMutation.isError && (
              <Alert variant="error">
                <AlertCircleIcon />
                <AlertTitle>Unable to rename plan.</AlertTitle>
                <AlertDescription>
                  <p>{createPlanMutation.error.message}</p>
                </AlertDescription>
              </Alert>
            )}

            {createPlanMutation.isSuccess && (
              <Alert variant="success">
                <CheckCircleIcon />
                <AlertTitle>Plan renamed.</AlertTitle>
              </Alert>
            )}

            <div className="flex flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={createPlanMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createPlanMutation.isPending}>
                {createPlanMutation.isPending ? "Renaming..." : "Rename"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

const CreateGeneratorFormSchema = z.object({
  name: z.string().min(1, "Please enter a generator name"),
  templateType: GeneratorTemplateTypeSchema,
});

export function CreateGeneratorDialog({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}) {
  const form = useForm<z.infer<typeof CreateGeneratorFormSchema>>({
    resolver: zodResolver(CreateGeneratorFormSchema),
    defaultValues: {
      name: "New Generator",
      templateType: "default",
    },
  });
  const timetableGeneratorStore = useTimetableGeneratorStore(
    useShallow((state) => {
      return {
        createGenerator: state.createGenerator,
      };
    })
  );

  // We will use RQ to do state management despite the action being synchronous.
  const createPlanMutation = useMutation({
    mutationFn: async (data: z.infer<typeof CreateGeneratorFormSchema>) => {
      timetableGeneratorStore?.createGenerator(data.name, data.templateType);
      setIsOpen(false);
    },
  });

  const onSubmit = (data: z.infer<typeof CreateGeneratorFormSchema>) => {
    createPlanMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Generator</DialogTitle>
          <DialogDescription>
            Create a new generator. This is available to all your timetables.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Generator Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter generator name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="templateType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template</FormLabel>
                  <FormControl>
                    <div className="flex flex-row gap-2">
                      <Button
                        variant="outline"
                        className={cn(
                          "flex-1 justify-start items-start flex flex-col gap-1 p-3 h-full",
                          {
                            "border-primary dark:border-primary":
                              field.value === "default",
                          }
                        )}
                        onClick={(e) => {
                          e.preventDefault();
                          field.onChange("default");
                        }}
                      >
                        <h3 className="font-medium">Default</h3>
                        <p className="text-left text-muted-foreground wrap-break-word whitespace-normal">
                          A basic generator that will try to generate a
                          timetable that is as balanced as possible.
                        </p>
                      </Button>
                      <Button
                        variant="outline"
                        className={cn(
                          "flex-1 justify-start items-start flex flex-col gap-1 p-3 h-full",
                          {
                            "border-primary dark:border-primary":
                              field.value === "empty",
                          }
                        )}
                        onClick={(e) => {
                          e.preventDefault();
                          field.onChange("empty");
                        }}
                      >
                        <h3 className="font-medium">Empty</h3>
                        <p className="text-left text-muted-foreground wrap-break-word whitespace-normal">
                          An empty generator that will not have any constraints.
                        </p>
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {createPlanMutation.isError && (
              <Alert variant="error">
                <AlertCircleIcon />
                <AlertTitle>Unable to create generator.</AlertTitle>
                <AlertDescription>
                  <p>{createPlanMutation.error.message}</p>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={createPlanMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createPlanMutation.isPending}>
                {createPlanMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

const RenameGeneratorFormSchema = z.object({
  name: z.string().min(1, "Please enter a generator name"),
});

export function RenameGeneratorDialog({
  options,
  isOpen,
  setIsOpen,
}: {
  options?: ExtractOptions<"rename-generator">;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}) {
  const form = useForm<z.infer<typeof RenameGeneratorFormSchema>>({
    resolver: zodResolver(RenameGeneratorFormSchema),
    defaultValues: {
      name: options?.defaultName ?? "",
    },
  });
  const timetableGeneratorStore = useTimetableGeneratorStore(
    useShallow((state) => {
      return {
        changeGeneratorName: state.changeGeneratorName,
      };
    })
  );

  // We will use RQ to do state management despite the action being synchronous.
  const renameGeneratorMutation = useMutation({
    mutationFn: async (data: z.infer<typeof RenameGeneratorFormSchema>) => {
      if (!options) {
        return;
      }
      const { generatorRef } = options;
      timetableGeneratorStore?.changeGeneratorName(generatorRef, data.name);
    },
  });

  const onSubmit = (data: z.infer<typeof RenameGeneratorFormSchema>) => {
    renameGeneratorMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Generator</DialogTitle>
          <DialogDescription>Rename this generator.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Generator Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter generator name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {renameGeneratorMutation.isError && (
              <Alert variant="error">
                <AlertCircleIcon />
                <AlertTitle>Unable to rename generator.</AlertTitle>
                <AlertDescription>
                  <p>{renameGeneratorMutation.error.message}</p>
                </AlertDescription>
              </Alert>
            )}

            {renameGeneratorMutation.isSuccess && (
              <Alert variant="success">
                <CheckCircleIcon />
                <AlertTitle>Generator renamed.</AlertTitle>
              </Alert>
            )}

            <div className="flex flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={renameGeneratorMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={renameGeneratorMutation.isPending}
              >
                {renameGeneratorMutation.isPending ? "Renaming..." : "Rename"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteGeneratorConfirmationDialog({
  options,
  isOpen,
  setIsOpen,
}: {
  options?: ExtractOptions<"delete-generator-confirmation">;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}) {
  const timetableStore = useTimetableGeneratorStore(
    useShallow((state) => {
      return {
        deleteGenerator: state.deleteGenerator,
      };
    })
  );

  // We will use RQ to do state management despite the action being synchronous.
  const deleteGeneratorMutation = useMutation({
    mutationFn: async () => {
      if (!options) {
        return;
      }
      const { generatorRef } = options;
      timetableStore?.deleteGenerator(generatorRef);
      setIsOpen(false);
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Generator</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this generator? This generator is
            used by all your timetables, so deleting it will remove it from all
            of them.
          </DialogDescription>
        </DialogHeader>

        {deleteGeneratorMutation.isError && (
          <Alert variant="error">
            <AlertCircleIcon />
            <AlertTitle>Unable to delete generator.</AlertTitle>
            <AlertDescription>
              <p>{deleteGeneratorMutation.error.message}</p>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={deleteGeneratorMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => deleteGeneratorMutation.mutate()}
            disabled={
              deleteGeneratorMutation.isPending ||
              deleteGeneratorMutation.isSuccess
            }
          >
            {deleteGeneratorMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ImportPlanDialog({
  options,
  isOpen,
  setIsOpen,
}: {
  options?: ExtractOptions<"import-plan">;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}) {
  const timetableStore = useTimetableStore(
    useShallow((state) => {
      let timetable: Timetable | null = null;

      let planRefName = "";
      if (options?.type === "current" || options?.type === "copy") {
        timetable = state.timetables.get(options.planRef.timetableId) ?? null;
        if (!timetable) {
          return null;
        }
        const plan = timetable.plans.get(options.planRef.planId);
        if (plan) {
          planRefName = plan.name;
        }
      } else if (options?.type === "new") {
        timetable = state.timetables.get(options.timetableId) ?? null;
      }

      if (!timetable) {
        return null;
      }

      return {
        acadYear: timetable.acadYear,
        planRefName,
        selectCourseIndexes: state.selectCourseIndexes,
        createPlanCopy: state.createPlanCopy,
        createPlan: state.createPlan,
      };
    })
  );

  const utils = trpc.useUtils();

  const [rawImport, setRawImport] = useState("");
  const importCourses = useMemo(() => {
    return deserializePlanCourses(rawImport);
  }, [rawImport]);

  // We will use RQ to do state management despite the action being synchronous.
  const importPlanMutation = useMutation({
    mutationFn: async (courses: typeof importCourses) => {
      if (!options) {
        return;
      }
      if (!timetableStore) {
        return;
      }

      const duplicatedCoursesCheckMap = new Map<string, number[]>();
      for (let i = 0; i < courses.length; i++) {
        const course = courses[i];
        const cur = duplicatedCoursesCheckMap.get(course.courseCode);
        if (cur) {
          cur.push(i);
        } else {
          duplicatedCoursesCheckMap.set(course.courseCode, [i]);
        }
      }
      // If there are any courses that are duplicated, consolidate it all.
      const erroredEntries: ({
        courseCode: string;
        index: string | null;
      } | null)[] = new Array(courses.length).fill(null);
      for (const indices of duplicatedCoursesCheckMap.values()) {
        if (indices.length > 1) {
          for (const index of indices) {
            erroredEntries[index] = {
              courseCode: courses[index].courseCode,
              index: courses[index].index,
            };
          }
        }
      }
      if (erroredEntries.some((entry) => entry)) {
        return {
          type: "error",
          message: "There are duplicated courses in the import.",
          indices: erroredEntries,
        } as const;
      }

      const importCourseSelections = courses.map((course) => ({
        courseCode: course.courseCode,
        index: course.index ?? "",
      }));

      const courseIndexPairs = await utils.client.getCourseIndexPairs.query({
        courses: importCourseSelections,
        acadYear: timetableStore.acadYear,
      });

      const courseIndexPairsMap = new Map(
        courseIndexPairs.map((pair) => [pair.course.code, pair.index])
      );

      // Check to see if the course indexes are valid.
      for (let i = 0; i < courses.length; i++) {
        const course = courses[i];
        const index = course.index;
        if (index === null) {
          continue;
        }

        const check = courseIndexPairsMap.get(course.courseCode);
        if (check === undefined || check !== index) {
          erroredEntries[i] = {
            courseCode: course.courseCode,
            index: course.index,
          };
        }
      }

      if (erroredEntries.some((entry) => entry)) {
        return {
          type: "error",
          message: "There are invalid course/indexes in the import.",
          indices: erroredEntries,
        } as const;
      }

      if (options.type === "current") {
        const res = timetableStore.selectCourseIndexes(
          options.planRef,
          importCourseSelections,
          false
        );
        if (res.type === "error") {
          return {
            type: "error",
            message: res.error,
            indices: [],
          } as const;
        }
      } else if (options.type === "copy") {
        const newPlan = timetableStore.createPlanCopy(options.planRef);
        if (newPlan.type === "error") {
          return {
            type: "error",
            message: newPlan.error,
            indices: [],
          } as const;
        }
        const res = timetableStore.selectCourseIndexes(
          {
            timetableId: options.planRef.timetableId,
            planId: newPlan.planId,
          },
          importCourseSelections
        );
        if (res.type === "error") {
          return {
            type: "error",
            message: res.error,
            indices: [],
          } as const;
        }
      } else if (options.type === "new") {
        const newPlan = timetableStore.createPlan(
          {
            timetableId: options.timetableId,
          },
          "New Plan"
        );
        if (newPlan.type === "error") {
          return {
            type: "error",
            message: newPlan.error,
            indices: [],
          } as const;
        }
        const res = timetableStore.selectCourseIndexes(
          {
            timetableId: options.timetableId,
            planId: newPlan.planId,
          },
          importCourseSelections
        );
        if (res.type === "error") {
          return {
            type: "error",
            message: res.error,
            indices: [],
          } as const;
        }
      }

      return {
        type: "success",
        message: "Plan imported successfully.",
      } as const;
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="w-full max-w-lg md:max-w-xl lg:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Plan</DialogTitle>
          <DialogDescription>
            {options?.type === "current" && (
              <span>
                Import a <span className="text-primary">shared plan</span> to
                current plan,{" "}
                {timetableStore?.planRefName ? (
                  <span className="text-primary">
                    {timetableStore.planRefName}
                  </span>
                ) : (
                  <span className="text-red-600 dark:text-red-400">
                    Unknown Plan
                  </span>
                )}{" "}
              </span>
            )}
            {options?.type === "copy" && (
              <span>
                Import a <span className="text-primary">shared plan</span> to
                copy of plan,{" "}
                {timetableStore?.planRefName ? (
                  <span className="text-primary">
                    {timetableStore.planRefName}
                  </span>
                ) : (
                  <span className="text-red-600 dark:text-red-400">
                    Unknown Plan
                  </span>
                )}{" "}
                (Copy)
              </span>
            )}
            {options?.type === "new" && (
              <span>
                Import a <span className="text-primary">shared plan</span> to a
                new plan
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-row items-center gap-4">
          <Textarea
            className="resize-none h-52"
            value={rawImport}
            onChange={(e) => setRawImport(e.target.value)}
            placeholder={`Import a shared plan. E.g.
CC0001: 10011
CC0007: 10012
CC0008: ?`}
          />
          <Button
            variant="outline"
            className="opacity-100 disabled:opacity-100"
            size="icon"
            disabled
          >
            <ArrowRightLeftIcon className="w-4 h-4" />
          </Button>
          <ScrollArea className="w-full h-52 border-border border rounded-md">
            <div className="flex flex-col gap-2 p-2">
              {importCourses.map((course, index) => {
                const err = importPlanMutation.data?.indices?.[index];
                const isErrored =
                  err !== null &&
                  err?.courseCode === course.courseCode &&
                  err?.index === course.index;
                return (
                  <div key={index} className="flex flex-row items-center">
                    <p className="text-foreground truncate text-sm break-words flex-1">
                      {course.courseCode}
                    </p>
                    <Input
                      value={course.index ?? "Not Selected"}
                      disabled
                      className={cn("flex-1", {
                        "text-red-600 dark:text-red-400 border-red-600 dark:border-red-400 opacity-50 disabled:opacity-100":
                          isErrored,
                      })}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setRawImport(
                          rawImport
                            .split("\n")
                            .filter((_, i) => i !== index)
                            .join("\n")
                        );
                      }}
                    >
                      <XIcon className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
        {importPlanMutation.isSuccess &&
          importPlanMutation.data?.type === "error" && (
            <Alert variant="error">
              <AlertTitle>Unable to import plan.</AlertTitle>
              <AlertDescription>
                {importPlanMutation.data.message}
              </AlertDescription>
            </Alert>
          )}
        {importPlanMutation.isSuccess &&
          importPlanMutation.data?.type === "success" && (
            <Alert variant="success">
              <AlertTitle>Plan imported successfully.</AlertTitle>
            </Alert>
          )}
        {importPlanMutation.isError && (
          <Alert variant="error">
            <AlertTitle>Unable to import plan.</AlertTitle>
          </Alert>
        )}
        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="default"
            disabled={
              importCourses.length <= 0 ||
              importPlanMutation.isPending ||
              (importPlanMutation.isSuccess &&
                importPlanMutation.data?.type !== "error")
            }
            onClick={() => importPlanMutation.mutate(importCourses)}
          >
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TimetableModal() {
  const modalStore = useTimetableModalStore(
    useShallow((state) => {
      return {
        action: state.action,
        setAction: state.setAction,
      };
    })
  );
  const setOpen = useCallback(
    (open: boolean) => {
      modalStore.setAction(null);
    },
    [modalStore.setAction]
  );

  return (
    <>
      <NewPlanDialog
        key={`create-plan-${modalStore.action?.key}`}
        options={
          modalStore.action?.type === "create-plan"
            ? modalStore.action.options
            : undefined
        }
        isOpen={modalStore.action?.type === "create-plan"}
        setIsOpen={setOpen}
      />
      <RenamePlanDialog
        key={`rename-plan-${modalStore.action?.key}`}
        options={
          modalStore.action?.type === "rename-plan"
            ? modalStore.action.options
            : undefined
        }
        isOpen={modalStore.action?.type === "rename-plan"}
        setIsOpen={setOpen}
      />
      <CreateGeneratorDialog
        key={`create-generator-${modalStore.action?.key}`}
        isOpen={modalStore.action?.type === "create-generator"}
        setIsOpen={setOpen}
      />
      <RenameGeneratorDialog
        key={`rename-generator-${modalStore.action?.key}`}
        options={
          modalStore.action?.type === "rename-generator"
            ? modalStore.action.options
            : undefined
        }
        isOpen={modalStore.action?.type === "rename-generator"}
        setIsOpen={setOpen}
      />
      <DeleteGeneratorConfirmationDialog
        key={`delete-generator-confirmation-${modalStore.action?.key}`}
        options={
          modalStore.action?.type === "delete-generator-confirmation"
            ? modalStore.action.options
            : undefined
        }
        isOpen={modalStore.action?.type === "delete-generator-confirmation"}
        setIsOpen={setOpen}
      />
      <ImportPlanDialog
        key={`import-plan-${modalStore.action?.key}`}
        options={
          modalStore.action?.type === "import-plan"
            ? modalStore.action.options
            : undefined
        }
        isOpen={modalStore.action?.type === "import-plan"}
        setIsOpen={setOpen}
      />
    </>
  );
}
