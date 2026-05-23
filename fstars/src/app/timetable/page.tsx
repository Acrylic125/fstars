import { MainNavbar } from "@/components/nav/main-navbar";
import {
  TimetableList,
  TimetableListHeader,
} from "@/components/timetable/timetable-list";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Home() {
  return (
    <main>
      <MainNavbar />
      <ScrollArea className="relative w-full flex flex-col h-[calc(100svh-3.5rem)] md:h-[calc(100svh-4rem)] overflow-x-auto">
        <div className="flex flex-col max-w-ui mx-auto">
          <div className="w-full flex flex-col items-center bg-sky-200 dark:bg-sky-700 text-black dark:text-white">
            <div className="mx-auto px-4 py-1 text-sm">
              Remember to{" "}
              <span className="font-bold underline">
                export your timetables
              </span>{" "}
              to back them up! Your timetables are stored in your browser.
            </div>
          </div>
          <div className="flex flex-col w-full py-8 px-4 md:px-8 gap-4">
            <TimetableListHeader />
            <TimetableList />
          </div>
        </div>
      </ScrollArea>
    </main>
  );
}
