"use client";

import { Label } from "@/components/ui/label";
import {
  asProgramName,
  SelectProgramCombobox,
} from "@/components/combobox/select-program-combox";
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
import { nanoid, z } from "zod";
import { useEffect } from "react";

const formSchema = z.object({
  program: z.object(
    {
      code: z.string().min(1, "Please select a program"),
      name: z.string().min(1, "Please select a program"),
      year: z.number().min(1, "Please select a program"),
      subCode: z.string().min(1, "Please select a program").optional(),
    },
    "Please select a program"
  ),
  name: z.string().min(1, "Please enter a timetable name"),
});

export function CreateTimetable() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      program: undefined,
      name: "",
    },
  });

  const programValue = form.watch("program");
  // Update name field when program changes
  useEffect(() => {
    const isNameFieldDirty = form.getFieldState("name").isDirty;
    if (!isNameFieldDirty && programValue !== undefined) {
      form.setValue("name", `${asProgramName(programValue)} Timetable`, {
        shouldDirty: false,
        shouldValidate: true,
      });
    }
  }, [programValue, form]);

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    const id = nanoid();
    console.log("Form submitted:", data);
    // Handle form submission here
  };

  return (
    <div className="flex flex-col w-full max-w-5xl px-12 py-8 md:px-20 md:py-12 gap-6 md:gap-8">
      <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">
        Create Timetable - AY25/26 Semester 1
      </h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="program"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base md:text-lg">
                  What program are you from?
                </FormLabel>
                <FormControl>
                  <SelectProgramCombobox
                    value={
                      field.value !== undefined
                        ? asProgramName(field.value)
                        : null
                    }
                    onChange={(value) => field.onChange(value || "")}
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

          <div className="flex flex-row gap-2">
            <Button type="submit">Create</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
