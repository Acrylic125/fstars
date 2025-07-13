import { CreateTimetable } from "@/components/timetable/create";
import { MainNavbar } from "@/components/nav/main-navbar";

export default function Home() {
  return (
    <main className="flex flex-col w-full">
      <MainNavbar />
      <div className="flex flex-col items-center h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] overflow-auto">
        <div className="flex flex-col w-full h-full items-center py-10">
          <CreateTimetable />
        </div>
      </div>
    </main>
  );
}
