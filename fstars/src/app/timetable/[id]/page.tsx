import { Label } from "@/components/ui/label";
import { SelectProgramCombobox } from "@/components/combobox/select-program-combox";
import { Button } from "@/components/ui/button";
import { CreateTimetable } from "@/components/timetable/create";
import { MainNavbar } from "@/components/nav/main-navbar";
import { TimetableView } from "@/components/timetable/timetable-view";

export default async function Home(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  console.log(id);
  // const timetable = useTimetableStore.getState().getTimetable(id);
  return (
    <main className="flex flex-col w-full">
      <MainNavbar />
      <div className="flex flex-col items-center">
        <div className="w-full flex flex-row max-w-ui">
          <div className="w-full flex flex-col h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] overflow-x-auto">
            <div className="w-full min-w-5xl h-full px-4 py-8 gap-4 flex flex-col">
              <div className="flex flex-col gap-1">
                <p className="text-sm text-muted-foreground">
                  Computer Science Year 2
                </p>
                <h1 className="text-2xl font-semibold">
                  Computer Science Year 2
                </h1>
              </div>
              <div className="min-h-[50rem] max-h-[80rem] h-full">
                <TimetableView />
              </div>
            </div>
          </div>
          <div className="w-xs md:w-md flex flex-col items-center h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] overflow-auto py-8 px-4">
            <div className="w-full border border-border bg-card rounded-lg p-4">
              <h2 className="text-base font-semibold">Courses</h2>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
