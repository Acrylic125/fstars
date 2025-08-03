"use client";

import { useCallback, useState } from "react";
import { Button } from "../ui/button";
import { TimetableId, useTimetableStore } from "./timetable-store";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import { useTimetableGeneratorStore } from "./timetable-generator-store";
import {
  downloadObjectAsJSONFile,
  exportTimetable,
} from "./timetable-export-utils";
import { nanoid } from "nanoid";
import { Indicator, useIndicator } from "../ui/indicator";
import { useMutation } from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

export function DeleteTimetableModal({
  timetableId,
}: {
  timetableId: TimetableId;
}) {
  const [page, setPage] = useState<"export" | "delete">("export");

  const timetableStore = useTimetableStore(
    useShallow((state) => {
      return {
        deleteTimetable: state.deleteTimetable,
      };
    })
  );

  const controls = useIndicator();
  const exportTimetableFile = useCallback(() => {
    const timetableState = useTimetableStore
      .getState()
      .timetables.get(timetableId);
    if (!timetableState) {
      return;
    }
    const generators = useTimetableGeneratorStore.getState().generators;
    const json = exportTimetable({
      version: 1,
      timetables: new Map([[timetableId, timetableState]]),
      generators,
    });
    const filename = `${timetableState.name} ${nanoid(8)}.json`;
    downloadObjectAsJSONFile(json, filename);
    controls.showIndicator(`Exported ${filename} to downloads!`, "success");
  }, [timetableId, controls]);

  const router = useRouter();
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = timetableStore.deleteTimetable(timetableId);
      if (res.type === "error") {
        throw new Error(res.error);
      }
      router.push("/timetable");
    },
  });

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Are you sure?</DialogTitle>

        {page === "export" && (
          <DialogDescription className="min-h-16">
            Consider exporting, to make a back up, before deleting! You can
            import it if you ever need it again.
          </DialogDescription>
        )}
        {page === "delete" && (
          <DialogDescription className="min-h-16">
            Deleting this timetable is{" "}
            <span className="text-destructive">
              permanent and cannot be undone
            </span>
            . However, it will not affect any generators, as they are shared
            across all your timetables.
          </DialogDescription>
        )}
      </DialogHeader>

      {page === "delete" && deleteMutation.isError && (
        <div>
          <Alert variant="error">
            <AlertTitle>Unable to import plan.</AlertTitle>
            <AlertDescription>{deleteMutation.error.message}</AlertDescription>
          </Alert>
        </div>
      )}

      {page === "export" && (
        <DialogFooter className="flex flex-row w-full justify-between sm:justify-between">
          <div className="flex flex-row gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <div className="relative flex flex-row gap-2">
              <Indicator controls={controls} className="w-48 z-20" />
              <Button variant="default" onClick={exportTimetableFile}>
                Export
              </Button>
            </div>
          </div>
          <Button variant="ghost" onClick={() => setPage("delete")}>
            Next
            <ArrowRightIcon />
          </Button>
        </DialogFooter>
      )}
      {page === "delete" && (
        <DialogFooter className="flex flex-row w-full justify-between sm:justify-between">
          <div className="flex flex-row gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <DialogFooter className="sm:justify-start">
              <Button
                variant="destructive"
                disabled={deleteMutation.isPending || deleteMutation.isSuccess}
                onClick={() => deleteMutation.mutate()}
              >
                Yes, Delete
              </Button>
            </DialogFooter>
          </div>
          <Button variant="ghost" onClick={() => setPage("export")}>
            <ArrowLeftIcon />
            Back
          </Button>
        </DialogFooter>
      )}
    </DialogContent>
  );
}

export function DeleteTimetable({ timetableId }: { timetableId: TimetableId }) {
  return (
    <div className="flex flex-col w-full bg-card border border-border rounded-md p-4 gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-bold text-destructive">Danger Zone</h2>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Deleting this timetable is{" "}
          <span className="text-destructive">
            permanent and cannot be undone
          </span>
          . However, it will not affect any generators, as they are shared
          across all your timetables.
        </p>
      </div>
      <div className="flex flex-col w-fit">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="destructiveOutline">Delete Timetable</Button>
          </DialogTrigger>
          <DeleteTimetableModal timetableId={timetableId} />
        </Dialog>
      </div>
    </div>
  );
}
