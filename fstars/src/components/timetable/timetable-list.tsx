"use client";

import { useShallow } from "zustand/react/shallow";
import { TimetableId, useTimetableStore } from "./timetable-store";
import { useCallback, useMemo, useState } from "react";
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
import {
  DownloadIcon,
  EllipsisIcon,
  ImportIcon,
  PlusIcon,
  TrashIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "../ui/context-menu";
import { DeleteTimetableModal } from "./delete-timetable";

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
            <Button variant="outline" size="sm">
              <ImportIcon className="w-4 h-4" />
              Import
            </Button>
          </DialogTrigger>
          <TimetableImportModal key={modalKey.key} />
        </Dialog>
        <div className="relative flex flex-row gap-2 w-fit">
          <Indicator controls={controls} className="w-48 z-10" />
          <Button
            variant="outline"
            size="sm"
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
            <DownloadIcon className="w-4 h-4" />
            Export
          </Button>
        </div>
        <Button variant="default" asChild size="sm">
          <Link href="/new">
            <PlusIcon className="w-4 h-4" />
            New
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function TimetableList() {
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
            <TableHead className="w-12">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {timetablesCached.map((timetable) => (
            <TimetableRow
              key={timetable.id}
              timetableId={timetable.id}
              timetableName={timetable.name}
              acadYearCode={timetable.acadYear.yearCode}
              semesterCode={timetable.acadYear.semesterCode}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function TimetableRow({
  timetableId,
  timetableName,
  acadYearCode,
  semesterCode,
}: {
  timetableId: TimetableId;
  timetableName: string;
  acadYearCode: string | number;
  semesterCode: string | number;
}) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const href = `/timetable/${timetableId}`;

  const handleExport = useCallback(() => {
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
  }, [timetableId]);

  const openDelete = useCallback(() => setDeleteOpen(true), []);

  return (
    <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <TableRow
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
              {/* Inner Link preserves middle-click and open-in-new-tab. */}
              <Link
                href={href}
                className="outline-none"
                onClick={(event) => event.stopPropagation()}
              >
                {timetableName}
              </Link>
            </TableCell>
            <TableCell className="text-muted-foreground">
              AY{acadYearCode} Semester {semesterCode}
            </TableCell>
            <TableCell
              className="text-right w-12"
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <EllipsisIcon className="h-4 w-4" />
                    <span className="sr-only">
                      Open actions for {timetableName}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={handleExport}>
                    <DownloadIcon className="h-4 w-4" /> Export
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onSelect={openDelete}>
                    <TrashIcon className="h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onSelect={handleExport}>
            <DownloadIcon className="h-4 w-4" /> Export
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem variant="destructive" onSelect={openDelete}>
            <TrashIcon className="h-4 w-4" /> Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      <DeleteTimetableModal timetableId={timetableId} />
    </Dialog>
  );
}
