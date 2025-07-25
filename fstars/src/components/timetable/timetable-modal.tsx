"use client";
import { create } from "zustand";
import {
  TimetableId,
  TimetablePlanRef,
  useTimetableStore,
} from "./timetable-store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "../ui/button";
import { AlertCircleIcon, CheckCircleIcon } from "lucide-react";
import { nanoid } from "nanoid";
import {
  GeneratorTemplateTypeSchema,
  TimetableGeneratorId,
  useTimetableGeneratorStore,
} from "./timetable-generator-store";
import { cn } from "@/lib/utils";

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
  options: { timetableId },
  isOpen,
  setIsOpen,
}: {
  options: ExtractOptions<"create-plan">;
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
      timetableStore?.createPlan(
        {
          timetableId,
        },
        data.name
      );
      setIsOpen(false);
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
  options: { planRef, defaultName },
  isOpen,
  setIsOpen,
}: {
  options: ExtractOptions<"rename-plan">;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}) {
  const form = useForm<z.infer<typeof RenamePlanFormSchema>>({
    resolver: zodResolver(RenamePlanFormSchema),
    defaultValues: {
      name: defaultName,
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
  options: { generatorRef, defaultName },
  isOpen,
  setIsOpen,
}: {
  options: ExtractOptions<"rename-generator">;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}) {
  const form = useForm<z.infer<typeof RenameGeneratorFormSchema>>({
    resolver: zodResolver(RenameGeneratorFormSchema),
    defaultValues: {
      name: defaultName,
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
  options: { generatorRef },
  isOpen,
  setIsOpen,
}: {
  options: ExtractOptions<"delete-generator-confirmation">;
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
            : { timetableId: "" }
        }
        isOpen={modalStore.action?.type === "create-plan"}
        setIsOpen={setOpen}
      />
      <RenamePlanDialog
        key={`rename-plan-${modalStore.action?.key}`}
        options={
          modalStore.action?.type === "rename-plan"
            ? modalStore.action.options
            : { planRef: { timetableId: "", planId: "" }, defaultName: "" }
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
            : { generatorRef: "", defaultName: "" }
        }
        isOpen={modalStore.action?.type === "rename-generator"}
        setIsOpen={setOpen}
      />
      <DeleteGeneratorConfirmationDialog
        key={`delete-generator-confirmation-${modalStore.action?.key}`}
        options={
          modalStore.action?.type === "delete-generator-confirmation"
            ? modalStore.action.options
            : { generatorRef: "" }
        }
        isOpen={modalStore.action?.type === "delete-generator-confirmation"}
        setIsOpen={setOpen}
      />
    </>
  );
}
