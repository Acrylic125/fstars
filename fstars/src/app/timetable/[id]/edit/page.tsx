import { MainNavbar } from "@/components/nav/main-navbar";
import { TimetableModal } from "@/components/timetable/timetable-modal";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { EditTimetable } from "@/components/timetable/edit-timetable";
import { programsTable } from "@/db/schema";
import { eq, not } from "drizzle-orm";
import { db } from "@/db";
import { DeleteTimetable } from "@/components/timetable/delete-timetable";

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
      <div className="flex flex-col items-center gap-8 py-8 md:py-12">
        <div className="w-full flex flex-col gap-6 md:gap-8 max-w-5xl px-12 md:px-20">
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
        </div>
        <div className="w-full border-t border-border border-dashed" />
        <div className="w-full flex flex-col gap-6 md:gap-8 max-w-5xl px-8 md:px-16">
          <DeleteTimetable timetableId={id} />
        </div>
      </div>
      <TimetableModal />
    </main>
  );
}
