"use client";
import { create } from "zustand";
import {
  PlanId,
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
import { parseCourseCodesFromUrl, serializeCourseCodes } from "./utils";

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
      options: {
        planRef: PlanId;
        timetableId: TimetableId;
      };
    };

type ExtractOptions<T extends TimetableModalAction["type"]> = Extract<
  TimetableModalAction,
  { type: T }
>["options"];

type TimetableModalStore = {
  action: TimetableModalAction | null;
  setAction: (
    action: TimetableModalAction | null,
    refreshKey?: boolean
  ) => void;
};

export const useTimetableModalStore = create<TimetableModalStore>(
  (set, get) => ({
    action: null,
    setAction: (action) => {
      if (action === null) {
        return set({
          action: null,
        });
      }
      return set({
        action: action,
      });
    },
  })
);

const NewPlanFormSchema = z.object({
  name: z.string().min(1, "Please enter a plan name"),
});

export function NewPlanDialog({
  options,
  close,
}: {
  options: ExtractOptions<"create-plan">;
  close: () => void;
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
        close();
      } else {
        throw new Error(res.error);
      }
    },
  });

  const onSubmit = (data: z.infer<typeof NewPlanFormSchema>) => {
    createPlanMutation.mutate(data);
  };

  return (
    <>
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
              type="button"
              onClick={close}
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
    </>
  );
}

const RenamePlanFormSchema = z.object({
  name: z.string().min(1, "Please enter a plan name"),
});

export function RenamePlanDialog({
  options,
  close,
}: {
  options: ExtractOptions<"rename-plan">;
  close: () => void;
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
    <>
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
              type="button"
              onClick={close}
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
    </>
  );
}

const CreateGeneratorFormSchema = z.object({
  name: z.string().min(1, "Please enter a generator name"),
  templateType: GeneratorTemplateTypeSchema,
});

export function CreateGeneratorDialog({ close }: { close: () => void }) {
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
      close();
    },
  });

  const onSubmit = (data: z.infer<typeof CreateGeneratorFormSchema>) => {
    createPlanMutation.mutate(data);
  };

  return (
    <>
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
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start items-start flex flex-col gap-1 p-3 h-full w-full",
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
                        A basic generator that will try to generate a timetable
                        that is as balanced as possible.
                      </p>
                    </Button>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start items-start flex flex-col gap-1 p-3 h-full w-full",
                        {
                          "border-primary dark:border-primary":
                            field.value === "freetime-maxing",
                        }
                      )}
                      onClick={(e) => {
                        e.preventDefault();
                        field.onChange("freetime-maxing");
                      }}
                    >
                      <h3 className="font-medium">Freetime maxing</h3>
                      <p className="text-left text-muted-foreground wrap-break-word whitespace-normal">
                        Squeeze Lab/Design/Project classes.
                      </p>
                    </Button>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start items-start flex flex-col gap-1 p-3 h-full w-full",
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
                      <h3 className="font-medium">Custom</h3>
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
              onClick={close}
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
    </>
  );
}

const RenameGeneratorFormSchema = z.object({
  name: z.string().min(1, "Please enter a generator name"),
});

export function RenameGeneratorDialog({
  options,
  close,
}: {
  options: ExtractOptions<"rename-generator">;
  close: () => void;
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
    <>
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
              type="button"
              onClick={close}
              disabled={renameGeneratorMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={renameGeneratorMutation.isPending}>
              {renameGeneratorMutation.isPending ? "Renaming..." : "Rename"}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}

export function DeleteGeneratorConfirmationDialog({
  options,
  close,
}: {
  options: ExtractOptions<"delete-generator-confirmation">;
  close: () => void;
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
      close();
    },
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>Delete Generator</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete this generator? This generator is used
          by all your timetables, so deleting it will remove it from all of
          them.
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
          type="button"
          onClick={close}
          disabled={deleteGeneratorMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          variant="destructive"
          type="button"
          onClick={() => deleteGeneratorMutation.mutate()}
          disabled={
            deleteGeneratorMutation.isPending ||
            deleteGeneratorMutation.isSuccess
          }
        >
          {deleteGeneratorMutation.isPending ? "Deleting..." : "Delete"}
        </Button>
      </div>
    </>
  );
}

export function ImportPlanDialog({
  options,
  close,
}: {
  options: ExtractOptions<"import-plan">;
  close: () => void;
}) {
  const [importTarget, setImportTarget] = useState<"new" | "append">("new");
  const timetableStore = useTimetableStore(
    useShallow((state) => {
      const timetable = state.timetables.get(options.timetableId) ?? null;

      if (!timetable) {
        return null;
      }

      const plan = timetable.plans.get(options.planRef) ?? null;

      return {
        timetable,
        acadYear: timetable.acadYear,
        planRefName: plan?.name ?? "",
        selectCourseIndexes: state.selectCourseIndexes,
        createPlanCopy: state.createPlanCopy,
        createPlan: state.createPlan,
      };
    })
  );

  const utils = trpc.useUtils();

  const [rawImport, setRawImport] = useState("");
  const importCourses = useMemo(() => {
    try {
      const result = parseCourseCodesFromUrl(new URL(rawImport));
      return result;
    } catch (error) {
      return [];
    }
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
        index: course.index,
      }));

      const [courseIndexPairs, excludeIndexes] = await Promise.all([
        utils.client.getCourseIndexPairs.query({
          courses: importCourseSelections,
          acadYear: timetableStore.acadYear,
        }),
        utils.client.getProgramExcludedCourseIndexesMany.query({
          courseCodes: importCourseSelections.map((c) => c.courseCode),
          programs: timetableStore.timetable.programs,
          acadYear: timetableStore.acadYear,
        }),
      ]);

      const courseIndexPairsMap = new Map(
        courseIndexPairs.map((pair) => [pair.course.code, pair.index])
      );

      // Check to see if the course indexes are valid.
      for (let i = 0; i < courses.length; i++) {
        const course = courses[i];
        const index = course.index;
        if (index === "") {
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
          message:
            "There are invalid course/indexes in the import. Is this the right academic year?",
          indices: erroredEntries,
        } as const;
      }

      if (importTarget === "append") {
        const res = timetableStore.selectCourseIndexes(
          {
            timetableId: options.timetableId,
            planId: options.planRef,
          },
          importCourseSelections,
          {
            overrideAll: false,
            defaultIgnoreMappings: excludeIndexes,
          }
        );
        if (res.type === "error") {
          return {
            type: "error",
            message: res.error,
            indices: [],
          } as const;
        }
      } else if (importTarget === "new") {
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
          importCourseSelections,
          {
            overrideAll: true,
            defaultIgnoreMappings: excludeIndexes,
          }
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
    <>
      <DialogHeader>
        <DialogTitle>Import Plan</DialogTitle>
        <DialogDescription>
          <span>
            Import a <span className="text-primary">shared plan link</span>.
          </span>
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-4">
        <div className="w-full flex flex-row items-center gap-4">
          <Textarea
            className="resize-none h-52"
            value={rawImport}
            onChange={(e) => setRawImport(e.target.value)}
            placeholder={`Import a shared plan. E.g.

https://fstars.benapps.dev/preview?c=SC2008:10399,SC2001:10128`}
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
                        try {
                          const url = new URL(rawImport);
                          url.search = `c=${serializeCourseCodes(
                            importCourses
                              .map((c) => ({
                                courseCode: c.courseCode,
                                index: c.index ?? "",
                              }))
                              .filter((c) => c.courseCode !== course.courseCode)
                          )}`;

                          setRawImport(url.toString());
                        } catch (error) {}
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

        <div className="flex flex-col gap-2">
          <span>Where should we import the courses to?</span>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              type="button"
              className={cn(
                "flex-1 justify-start items-start flex flex-col gap-1 p-3 h-full w-full",
                {
                  "border-primary dark:border-primary": importTarget === "new",
                }
              )}
              onClick={(e) => {
                e.preventDefault();
                setImportTarget("new");
              }}
            >
              <h3 className="font-medium">New Plan</h3>
              <p className="text-left text-muted-foreground wrap-break-word whitespace-normal">
                Import the courses to a new plan.
              </p>
            </Button>
            <Button
              variant="outline"
              type="button"
              className={cn(
                "flex-1 justify-start items-start flex flex-col gap-1 p-3 h-full w-full text-left",
                {
                  "border-primary dark:border-primary":
                    importTarget === "append",
                }
              )}
              onClick={(e) => {
                e.preventDefault();
                setImportTarget("append");
              }}
            >
              <h3 className="font-medium">Add / Set to Current Plan</h3>
              <p className="text-left text-muted-foreground wrap-break-word whitespace-normal">
                Will override the selected indexes in the current plan.
              </p>
            </Button>
          </div>
        </div>
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
        <Button type="button" variant="outline" onClick={close}>
          Cancel
        </Button>
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
    </>
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

  const isOpen = modalStore.action !== null;
  const close = useCallback(() => {
    modalStore.setAction(null);
  }, [modalStore.setAction]);

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className="w-full max-w-lg md:max-w-xl lg:max-w-2xl">
        {modalStore.action?.type === "create-plan" && (
          <NewPlanDialog options={modalStore.action.options} close={close} />
        )}
        {modalStore.action?.type === "rename-plan" && (
          <RenamePlanDialog options={modalStore.action.options} close={close} />
        )}
        {modalStore.action?.type === "create-generator" && (
          <CreateGeneratorDialog close={close} />
        )}
        {modalStore.action?.type === "rename-generator" && (
          <RenameGeneratorDialog
            options={modalStore.action.options}
            close={close}
          />
        )}
        {modalStore.action?.type === "delete-generator-confirmation" && (
          <DeleteGeneratorConfirmationDialog
            options={modalStore.action.options}
            close={close}
          />
        )}
        {modalStore.action?.type === "import-plan" && (
          <ImportPlanDialog options={modalStore.action.options} close={close} />
        )}
      </DialogContent>
    </Dialog>
  );
}
