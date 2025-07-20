import { MainNavbar } from "@/components/nav/main-navbar";
import { TimetableView } from "@/components/timetable/timetable-view";
import {
  TimetableCoursesPanel,
  TimetableHeader,
} from "@/components/timetable/timetable-course-panel";
import { TimetableModal } from "@/components/timetable/timetable-modal";
import { TimetableGeneratorPanel } from "@/components/timetable/timetable-generator-panel";

export default async function Home(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  return (
    <main className="flex flex-col w-full">
      <MainNavbar />
      <div className="flex flex-col items-center">
        <div className="w-full flex flex-row max-w-ui">
          <div className="w-full flex flex-col h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] overflow-x-auto">
            <div className="w-full min-w-5xl h-full pl-4 pr-2 md:pl-8 md:pr-4 py-8 gap-4 flex flex-col">
              <TimetableHeader id={id} />
              <div className="min-h-[50rem] max-h-[80rem] h-full">
                <TimetableView id={id} />
              </div>
            </div>
          </div>
          <div className="w-md md:w-lg lg:w-xl flex flex-col gap-2 md:gap-4 items-center h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] overflow-auto py-8 pl-2 pr-4 md:pl-4 md:pr-8">
            <TimetableCoursesPanel id={id} />
            <TimetableGeneratorPanel timetableId={id} />
          </div>
        </div>
      </div>
      <TimetableModal />
    </main>
  );
}
