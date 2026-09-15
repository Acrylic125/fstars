import { MainNavbar } from "@/components/nav/main-navbar";
import { TimetableModal } from "@/components/timetable/timetable-modal";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { EditTimetable } from "@/components/timetable/edit-timetable";
import { DeleteTimetable } from "@/components/timetable/delete-timetable";
import { getPrograms } from "@/server/programs";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

async function SettingsContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const programs = await getPrograms();

  return (
    <>
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
    </>
  );
}

function SettingsSkeleton() {
  return (
    <div className="flex flex-col items-center gap-8 py-8 md:py-12">
      <div className="w-full flex flex-col gap-6 md:gap-8 max-w-5xl px-12 md:px-20">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-9 w-40" />
        </div>
        <Skeleton className="h-32 w-full" />
      </div>
      <div className="w-full border-t border-border border-dashed" />
      <div className="w-full max-w-5xl px-8 md:px-16">
        <Skeleton className="h-28 w-full" />
      </div>
    </div>
  );
}

export default function Home(props: { params: Promise<{ id: string }> }) {
  return (
    <main className="flex flex-col w-full">
      <MainNavbar />
      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsContent params={props.params} />
      </Suspense>
      <TimetableModal />
    </main>
  );
}
