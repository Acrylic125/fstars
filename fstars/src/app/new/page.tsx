import { Label } from "@/components/ui/label";
import { SelectProgramCombobox } from "@/components/combobox/select-program-combox";
import { Button } from "@/components/ui/button";
import { CreateTimetable } from "@/components/timetable/create";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <CreateTimetable />
    </div>
  );
}
