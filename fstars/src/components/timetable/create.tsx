"use client";

import { Label } from "@/components/ui/label";
import { SelectProgramCombobox } from "@/components/combobox/select-program-combox";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function CreateTimetable() {
  const [program, setProgram] = useState<string | null>(null);
  return (
    <div className="flex flex-col w-full max-w-5xl px-12 py-8 md:px-20 md:py-12 gap-6 md:gap-8">
      <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">
        Create Timetable - AY25/26 Semester 1
      </h1>
      <div className="grid w-full items-center gap-2 md:gap-3">
        <Label className="text-base md:text-lg">
          What program are you from?
        </Label>
        <SelectProgramCombobox
          value={program}
          onChange={(value) => setProgram(value)}
        />
        <p className="text-xs md:text-sm text-muted-foreground max-w-md">
          Some course indexes are reserved for programs. This helps us filter
          down what indexes are available to you.
        </p>
      </div>
      <div className="flex flex-row gap-2">
        <Button>Create</Button>
      </div>
    </div>
  );
}
