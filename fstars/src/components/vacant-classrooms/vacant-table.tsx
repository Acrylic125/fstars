"use client";

import Fuse from "fuse.js";
import { parseAsArrayOf, parseAsStringLiteral, useQueryState } from "nuqs";
import {
  Column,
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "../ui/badge";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { ArrowDown, ArrowUp, ArrowUpDown, Filter } from "lucide-react";
import { Input } from "../ui/input";
import { useDebouncedCallback } from "use-debounce";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
}

function useHideVacancy() {
  return useQueryState(
    "hideVacancy",
    parseAsArrayOf(parseAsStringLiteral(["vacant", "inUse"])).withDefault([])
  );
}

export function FilterShowVacancyButton<TData, TValue>({
  column,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const [hideVacancy, setHideVacancy] = useHideVacancy();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={hideVacancy.length === 0 ? "ghost" : "default"}
          size="icon"
        >
          <Filter />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Show Vacancy</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={!hideVacancy.includes("vacant")}
          onCheckedChange={() => {
            setHideVacancy(
              hideVacancy.includes("vacant")
                ? hideVacancy.filter((v) => v !== "vacant")
                : [...hideVacancy, "vacant"]
            );
          }}
        >
          Vacant
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={!hideVacancy.includes("inUse")}
          onCheckedChange={() => {
            setHideVacancy(
              hideVacancy.includes("inUse")
                ? hideVacancy.filter((v) => v !== "inUse")
                : [...hideVacancy, "inUse"]
            );
          }}
        >
          In Use
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
    // <div className={cn("flex items-center gap-2", className)}>

    // </div>
  );
}

export function SortButton<TData, TValue>({
  column,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const isSorted = column.getIsSorted();
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant={isSorted === false ? "ghost" : "default"}
        size="icon"
        onClick={() => {
          const currentSort = column.getIsSorted();
          if (currentSort === false) {
            column.toggleSorting(false); // Start with ascending
          } else if (currentSort === "asc") {
            column.toggleSorting(true); // Switch to descending
          } else {
            column.clearSorting(); // Clear sorting
          }
        }}
      >
        {isSorted === false ? (
          <ArrowUpDown className="h-4 w-4" />
        ) : isSorted === "asc" ? (
          <ArrowUp className="h-4 w-4" />
        ) : (
          <ArrowDown className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

export type Venues = {
  venue: string;
  status: "vacant" | "in use";
  freeUntil: string;
  classEndTime: number;
  area: string;
  location: string;
  remarks: string | null;
};

export const columns: ColumnDef<Venues>[] = [
  {
    accessorKey: "venue",
    // header: "Venue",
    header: ({ column }) => (
      <div className="flex items-center gap-2">
        Venue
        <SortButton column={column} />
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <div className="flex items-center gap-2">
        Status
        <div className="flex items-center flex-row gap-0">
          <SortButton column={column} />
          <FilterShowVacancyButton column={column} />
        </div>
      </div>
    ),
    cell: ({ row }) => {
      return (
        <Badge
          variant={row.original.status === "vacant" ? "default" : "destructive"}
        >
          {row.original.status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "freeUntil",
    header: ({ column }) => (
      <div className="flex items-center gap-2">
        Free Until
        <SortButton column={column} />
      </div>
    ),
  },
  {
    accessorKey: "area",
    header: ({ column }) => (
      <div className="flex items-center gap-2">
        Area
        <SortButton column={column} />
      </div>
    ),
  },
  {
    accessorKey: "location",
    header: ({ column }) => (
      <div className="flex items-center gap-2">
        Location
        <SortButton column={column} />
      </div>
    ),
  },
  // {
  //   accessorKey: "remarks",
  //   header: ({ column }) => (
  //     <div className="flex items-center gap-2">
  //       Remarks
  //       <SortButton column={column} />
  //     </div>
  //   ),
  // },
];

const colSpans = [1, 1, 1, 1, 2];

export function VacantTable({ data }: { data: Venues[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const fuse = useMemo(() => {
    return new Fuse(data, {
      keys: ["venue", "area", "location"],
    });
  }, [data]);

  const [hideVacancy] = useHideVacancy();
  const [search] = useQueryState("search");

  const filteredData = useMemo(() => {
    let _data = data;
    if (search) {
      _data = fuse.search(search).map((r) => r.item);
    }
    return _data.filter((d) => {
      if (hideVacancy.includes("vacant") && d.status === "vacant") {
        return false;
      }
      if (hideVacancy.includes("inUse") && d.status === "in use") {
        return false;
      }
      return true;
    });
  }, [fuse, search, hideVacancy]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4">
      <div className="min-w-6xl rounded-md border">
        <Table className="table-fixed">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header, index) => {
                  return (
                    <TableHead key={header.id} colSpan={colSpans[index]}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => {
                    router.push(
                      `/vacant-classrooms/${encodeURIComponent(row.original.venue)}`
                    );
                  }}
                >
                  {row.getVisibleCells().map((cell, index) => (
                    <TableCell key={cell.id} colSpan={colSpans[index]}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={colSpans.reduce((acc, curr) => acc + curr, 0)}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function VacantTableHeader() {
  const [search, setSearch] = useQueryState("search");
  const [raw, setRaw] = useState(search ?? "");
  const debouncedSearch = useDebouncedCallback(setSearch, 300);

  return (
    <div className="flex items-center gap-2">
      <Input
        type="text"
        placeholder="Search Venue"
        className="w-full max-w-md"
        value={raw}
        onChange={(e) => {
          setRaw(e.target.value);
          debouncedSearch(e.target.value);
        }}
      />
    </div>
  );
}
