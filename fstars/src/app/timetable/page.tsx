import { MainNavbar } from "@/components/nav/main-navbar";
import {
  TimetableList,
  TimetableListHeader,
} from "@/components/timetable/timetable-list";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Home() {
  return (
    <main>
      <MainNavbar />
      <ScrollArea className="relative w-full flex flex-col h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] overflow-x-auto">
        <div className="flex flex-col max-w-ui mx-auto px-4 py-8 md:px-8 gap-4">
          <TimetableListHeader />

          <Alert variant="info">
            <AlertTitle>
              <h2 className="text-lg font-bold">Export to backup!</h2>
            </AlertTitle>
            <AlertDescription>
              <p className="text-base text-neutral-700 dark:text-neutral-300">
                Your timetables are stored in your browser.{" "}
                <span className="text-foreground font-bold inline">
                  Remember to Export
                </span>{" "}
                to backup your timetables.
              </p>
            </AlertDescription>
          </Alert>
          <TimetableList />
        </div>
      </ScrollArea>
    </main>
  );
}
