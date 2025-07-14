import { MainNavbar } from "@/components/nav/main-navbar";
import { TimetableList } from "@/components/timetable/timetable-list";
import React from "react";

export default function Home() {
  return (
    <main>
      <MainNavbar />
      <div className="flex flex-col h-screen max-w-ui mx-auto px-4 py-8 md:px-8 gap-4">
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">
          Timetable
        </h1>
        <TimetableList />
      </div>
    </main>
  );
}
