import { MainNavbar } from "@/components/nav/main-navbar";
import {
  TimetableList,
  TimetableListHeader,
} from "@/components/timetable/timetable-list";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Home() {
  return (
    <main>
      <MainNavbar />
      <div className="flex flex-col h-screen max-w-ui mx-auto px-4 py-8 md:px-8 gap-4">
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
    </main>
  );
}
