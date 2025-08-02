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
import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Plan, Timetable, useTimetableStore } from "./timetable-store";
import { useShallow } from "zustand/react/shallow";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { AlertCircleIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Program } from "@/lib/types";
import { Config } from "@/lib/config";

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

export function CreateTimetable({ programs }: { programs: Program[] }) {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      programs: [],
      name: `My AY${Config.currentAcademicYear.yearCode} Semester ${Config.currentAcademicYear.semester} Timetable`,
    },
  });
  const timetableStore = useTimetableStore(
    useShallow((state) => {
      return {
        createTimetable: state.createTimetable,
      };
    })
  );

  // const programsValue = form.watch("programs");
  // Update name field when program changes
  // useEffect(() => {
  //   const isNameFieldDirty = form.getFieldState("name").isDirty;
  //   if (!isNameFieldDirty && programsValue !== undefined) {
  //     form.setValue(
  //       "name",
  //       `${programsValue
  //         .map((p) => {
  //           let name = p.code;
  //           if (p.subCode) {
  //             name += ` (${p.subCode})`;
  //           }
  //           if (p.year) {
  //             name += ` Year ${p.year}`;
  //           }
  //           return name;
  //         })
  //         .join(", ")} Timetable`,
  //       {
  //         shouldDirty: false,
  //         shouldValidate: true,
  //       }
  //     );
  //   }
  // }, [programsValue, form]);

  const createTimetableMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const id = nanoid(16);

      const defaultPlanId = nanoid(16);
      const defaultPlan: Plan = {
        id: defaultPlanId,
        name: "Default Plan",
        courses: new Map(),
      };

      const timetable: Timetable = {
        id,
        name: data.name,
        programs: data.programs,
        acadYear: {
          yearCode: Config.currentAcademicYear.yearCode,
          semesterCode: "1",
        },
        plans: new Map([[defaultPlanId, defaultPlan]]),
        selectedGeneratorId: "default",
        selectedPlanId: defaultPlanId,
      };
      const res = timetableStore.createTimetable(timetable);
      if (res.type === "success") {
        router.push(`/timetable/${res.timetableId}`);
      } else {
        throw new Error(res.error);
      }
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createTimetableMutation.mutate(data);
  };

  return (
    <div className="flex flex-col w-full max-w-5xl px-12 py-8 md:px-20 md:py-12 gap-6 md:gap-8">
      <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">
        Create Timetable - AY{Config.currentAcademicYear.yearCode} Semester{" "}
        {Config.currentAcademicYear.semester}
      </h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="programs"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base md:text-lg">
                  What programs are you in this semester? (i.e. Major, Minor,
                  Scholar program)
                </FormLabel>
                <FormControl>
                  <SelectProgramCombobox
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
                <p className="text-xs md:text-sm text-muted-foreground max-w-md">
                  Some course indexes are reserved for programs. This helps us
                  filter down what indexes are available to you.
                </p>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base md:text-lg">
                  Timetable Name
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter timetable name"
                    className="h-12"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {createTimetableMutation.isError && (
            <Alert variant="error">
              <AlertCircleIcon />
              <AlertTitle>Unable to create timetable.</AlertTitle>
              <AlertDescription>
                <p>{createTimetableMutation.error.message}</p>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-row gap-2">
            <Button
              type="submit"
              disabled={
                createTimetableMutation.isPending ||
                createTimetableMutation.isSuccess
              }
            >
              {createTimetableMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
