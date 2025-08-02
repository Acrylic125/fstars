"use client";

import {
  SelectProgramCombobox,
  serializeProgram,
} from "@/components/timetable/select-program-combox";
import { Button } from "@/components/ui/button";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { nanoid } from "nanoid";
import { useMutation } from "@tanstack/react-query";
import {
  Plan,
  Timetable,
  TimetableId,
  useTimetableStore,
} from "./timetable-store";
import { useShallow } from "zustand/react/shallow";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { AlertCircleIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Program } from "@/lib/types";
import { Config } from "@/lib/config";
import { useEffect, useState } from "react";

const formSchema = z.object({
  programs: z
    .array(
      z.object(
        {
          code: z.string().min(1, "Please select a program"),
          name: z.string().min(1, "Please select a program"),
          year: z
            .number()
            .min(1, "Please select a program")
            .nullable()
            .optional(),
          subCode: z
            .string()
            .min(1, "Please select a program")
            .nullable()
            .optional(),
        },
        "Please select a program"
      )
    )
    .min(1, "Please select at least 1 program")
    .max(
      Config.limits.programsInTimetable,
      `Please select up to ${Config.limits.programsInTimetable} programs`
    ),
  name: z
    .string()
    .min(1, "Please enter a timetable name")
    .max(64, "Timetable name is too long, max 64 characters"),
});

export function EditTimetable({
  timetableId,
  programs,
}: {
  timetableId: TimetableId;
  programs: Program[];
}) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      programs: [],
      name: "",
    },
  });
  const timetableStore = useTimetableStore(
    useShallow((state) => {
      return {
        updateTimetable: state.updateTimetable,
      };
    })
  );
  const [initialLoadInState, setInitialLoadInState] = useState<
    | {
        type: "loading" | "success";
      }
    | {
        type: "error";
        error: string;
      }
  >({
    type: "loading",
  });

  // Initialize defaults for RHF.
  useEffect(() => {
    const currentTimetable = useTimetableStore
      .getState()
      .timetables.get(timetableId);
    if (!currentTimetable) {
      setInitialLoadInState({
        type: "error",
        error: "Timetable not found",
      });
      return;
    }
    form.reset({
      programs: currentTimetable.programs,
      name: currentTimetable.name,
    });
    setInitialLoadInState({
      type: "success",
    });
  }, [form, timetableId, setInitialLoadInState]);

  const updateTimetableMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const res = timetableStore.updateTimetable(timetableId, {
        name: data.name,
        programs: data.programs,
      });
      if (res.type === "error") {
        throw new Error(res.error);
      }
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    updateTimetableMutation.mutate(data);
  };

  return (
    <div className="flex flex-col w-full gap-6 md:gap-8">
      {initialLoadInState.type === "error" && (
        <Alert variant="error">
          <AlertCircleIcon />
          <AlertTitle>Unable to load timetable.</AlertTitle>
          <AlertDescription>
            <p>{initialLoadInState.error}</p>
          </AlertDescription>
        </Alert>
      )}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="programs"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base md:text-lg">
                  Programs (i.e. Major, Minor, Scholar program)
                </FormLabel>
                <FormControl>
                  <SelectProgramCombobox
                    disabled={initialLoadInState.type !== "success"}
                    limit={Config.limits.programsInTimetable}
                    programs={programs}
                    value={field.value}
                    onChange={(value) => {
                      const serializedValue = serializeProgram(value);
                      const i = field.value.findIndex((p) => {
                        return serializeProgram(p) === serializedValue;
                      });
                      if (i !== -1) {
                        field.onChange(field.value.filter((_, j) => j !== i));
                      } else {
                        field.onChange([...field.value, value]);
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
                <div className="flex flex-col gap-2 text-xs md:text-sm text-muted-foreground max-w-md">
                  <p>
                    Some course indexes are reserved for programs. This helps us
                    filter down what indexes are available to you.
                  </p>
                  <p>
                    <span className="font-bold">NOTE</span> The filters will
                    only be applied upon adding a course.
                  </p>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base md:text-lg">Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter timetable name"
                    className="h-12"
                    disabled={initialLoadInState.type !== "success"}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {updateTimetableMutation.isSuccess && (
            <Alert variant="success">
              <AlertCircleIcon />
              <AlertTitle>Timetable saved.</AlertTitle>
            </Alert>
          )}
          {updateTimetableMutation.isError && (
            <Alert variant="error">
              <AlertCircleIcon />
              <AlertTitle>Unable to create timetable.</AlertTitle>
              <AlertDescription>
                <p>{updateTimetableMutation.error.message}</p>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-row gap-2">
            <Button type="submit" disabled={updateTimetableMutation.isPending}>
              {updateTimetableMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
