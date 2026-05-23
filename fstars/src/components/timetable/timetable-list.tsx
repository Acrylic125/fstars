"use client";

import { useShallow } from "zustand/react/shallow";
import { useTimetableStore } from "./timetable-store";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { downloadObjectAsJSONFile } from "./timetable-export-utils";
import { exportTimetable } from "./timetable-export-utils";
import { nanoid } from "nanoid";
import { Indicator, useIndicator } from "../ui/indicator";
import { useTimetableGeneratorStore } from "./timetable-generator-store";
import { Dialog, DialogTrigger } from "../ui/dialog";
import { TimetableImportModal } from "./timetable-import";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

export function TimetableListHeader() {
  const controls = useIndicator();
  const [modalKey, setModalKey] = useState<{
    isOpen: boolean;
    key: string;
  }>({
    isOpen: false,
    key: "",
  });

  return (
    <div className="flex flex-row justify-between items-center">
      <h1 className="text-xl md:text-2xl font-bold text-foreground">
        Timetables
      </h1>
      <div className="flex flex-row gap-2">
        <Dialog
          open={modalKey.isOpen}
          onOpenChange={(open) => {
            if (open) {
              setModalKey({
                isOpen: true,
                key: nanoid(8),
              });
            } else {
              setModalKey((prev) => ({
                isOpen: false,
                key: prev.key,
              }));
            }
          }}
        >
          <DialogTrigger asChild>
            <Button variant="outline">Import</Button>
          </DialogTrigger>
          <TimetableImportModal key={modalKey.key} />
        </Dialog>
        <div className="relative flex flex-row gap-2 w-fit">
          <Indicator controls={controls} className="w-48 z-10" />
          <Button
            variant="default"
            onClick={() => {
              const timetables = useTimetableStore.getState().timetables;
              const generators =
                useTimetableGeneratorStore.getState().generators;
              const json = exportTimetable({
                version: 1,
                timetables,
                generators,
              });
              const filename = `All Timetables ${nanoid(8)}.json`;
              downloadObjectAsJSONFile(json, filename);
              controls.showIndicator(
                `Exported ${filename} to downloads!`,
                "success"
              );
            }}
          >
            Export
          </Button>
        </div>
      </div>
    </div>
  );
}

export function TimetableList() {
  const router = useRouter();
  const { timetables } = useTimetableStore(
    useShallow((state) => {
      return {
        timetables: state.timetables,
      };
    })
  );
  const timetablesCached = useMemo(() => {
    return Array.from(timetables.values()).map((timetable) => ({
      id: timetable.id,
      name: timetable.name,
      programs: timetable.programs,
      acadYear: timetable.acadYear,
    }));
  }, [timetables]);

  return (
    <div className="border border-border rounded-md bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Acad Year</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {timetablesCached.map((timetable) => {
            const href = `/timetable/${timetable.id}`;
            return (
              <TableRow
                key={timetable.id}
                role="link"
                tabIndex={0}
                onClick={() => router.push(href)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    router.push(href);
                  }
                }}
                className="cursor-pointer focus-visible:bg-muted/50 outline-none"
              >
                <TableCell className="font-medium">
                  {/* Inner Link preserves middle-click, open-in-new-tab, and right-click. */}
                  <Link
                    href={href}
                    className="outline-none"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {timetable.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  AY{timetable.acadYear.yearCode} Semester{" "}
                  {timetable.acadYear.semesterCode}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
