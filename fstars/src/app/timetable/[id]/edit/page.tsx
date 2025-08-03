import { MainNavbar } from "@/components/nav/main-navbar";
import { TimetableModal } from "@/components/timetable/timetable-modal";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { EditTimetable } from "@/components/timetable/edit-timetable";
import { programsTable } from "@/db/schema";
import { eq, not } from "drizzle-orm";
import { db } from "@/db";

export const revalidate = 86400; // 24 hours

export default async function Home(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const programs = await db
    .select({
      name: programsTable.name,
      code: programsTable.code,
      subCode: programsTable.subCode,
      year: programsTable.year,
    })
    .from(programsTable)
    // We exclude BDES / Global Load because they are not real programs
    .where(not(eq(programsTable.code, "GLOAD")));
  return (
    <main className="flex flex-col w-full ">
      <MainNavbar />
      <div className="flex flex-col items-center">
        <div className="w-full flex flex-col gap-6 md:gap-8 max-w-5xl px-12 py-8 md:px-20 md:py-12">
          <div className="flex flex-col gap-1">
            <Button
              variant="ghost"
              asChild
              className="p-0 w-fit h-fit has-[>svg]:px-0"
            >
              <Link href={`/timetable/${id}`}>
                <ArrowLeftIcon /> Timetable
              </Link>
            </Button>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
              Settings
            </h1>
          </div>
          <EditTimetable timetableId={id} programs={programs} />
          {/* <ScrollArea className="w-md md:w-sm lg:w-md flex flex-col h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)]">
            <div className="w-full flex flex-row max-w-ui pl-4 md:pl-8 pr-2 md:pr-4 py-4 md:py-8">
              <div className="w-full flex flex-col max-w-ui py-4 bg-card border-border border rounded-md">
                <h3 className="text-sm md:text-base font-bold text-muted-foreground px-4">
                  Settings
                </h3>
                <Button
                  variant="ghost"
                  className="w-full justify-start px-4 py-2.5 h-fit text-sm md:text-base"
                >
                  General
                </Button>
                <Button
                  variant="destructiveGhost"
                  className="w-full justify-start px-4 py-2.5 h-fit text-sm md:text-base"
                >
                  Danger
                </Button>
              </div>
            </div>
          </ScrollArea> */}
          {/* <ScrollArea className="relative w-full flex flex-col h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] overflow-x-auto">
            <div className="w-full flex flex-row max-w-ui pl-4 md:pl-8 pr-2 md:pr-4 py-4 md:py-8">
              <h1 className="text-xl md:text-2xl font-bold">Settings</h1>
            </div>
          </ScrollArea> */}
        </div>
      </div>
      <TimetableModal />
    </main>
  );
}
