import { Label } from "@/components/ui/label";
import { SelectProgramCombobox } from "@/components/timetable/select-program-combox";
import { Button } from "@/components/ui/button";
import { CreateTimetable } from "@/components/timetable/create";
import { MainNavbar } from "@/components/nav/main-navbar";
import { TimetableView } from "@/components/timetable/timetable-view";
import { Input } from "@/components/ui/input";
import { PlusIcon } from "lucide-react";
import {
  TimetableCoursesPanel,
  TimetableHeader,
} from "@/components/timetable/timetable";

export default async function Home(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  return (
    <main className="flex flex-col w-full">
      <MainNavbar />
      <div className="flex flex-col items-center">
        <div className="w-full flex flex-row max-w-ui">
          <div className="w-full flex flex-col h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] overflow-x-auto">
            <div className="w-full min-w-5xl h-full px-4 py-8 gap-4 flex flex-col">
              <TimetableHeader id={id} />
              <div className="min-h-[50rem] max-h-[80rem] h-full">
                <TimetableView />
              </div>
            </div>
          </div>
          <div className="w-xs md:w-md flex flex-col items-center h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] overflow-auto py-8 px-4">
            <TimetableCoursesPanel id={id} />
            {/* <div className="w-full border border-border bg-card rounded-lg p-4 gap-2 flex flex-col">
              <h2 className="text-base font-semibold">Courses</h2>
              <div className="flex flex-row gap-2">
                <Button
                  variant="outline"
                  className="text-left flex flex-row items-center justify-start flex-1 px-2"
                >
                  Hello
                </Button>
                <Button variant="secondary" size="icon">
                  <PlusIcon className="w-4 h-4" />
                </Button>
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </main>
  );
}
