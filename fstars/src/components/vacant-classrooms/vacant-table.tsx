"use client";

import Fuse from "fuse.js";
import { parseAsArrayOf, parseAsStringLiteral, useQueryState } from "nuqs";
import {
  Column,
  ColumnDef,
  flexRender,
  getCoreRowModel,
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
import { cn, formatTime } from "@/lib/utils";
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

const sortTypes = [
  "venue",
  "status",
  "freeUntil",
  "classEndTime",
  "area",
  "location",
  "none",
] as const;

function useHideVacancy() {
  return useQueryState(
    "hideVacancy",
    parseAsArrayOf(parseAsStringLiteral(["vacant", "inUse"])).withDefault([])
  );
}

function useSortType() {
  return useQueryState(
    "sortType",
    parseAsStringLiteral(sortTypes).withDefault("none")
  );
}

function useSortOrder() {
  return useQueryState(
    "sortOrder",
    parseAsStringLiteral(["none", "asc", "desc"]).withDefault("none")
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
  sortType: _sortType,
}: DataTableColumnHeaderProps<TData, TValue> & {
  sortType: (typeof sortTypes)[number];
}) {
  const [sortType, setSortType] = useSortType();
  const [sortOrder, setSortOrder] = useSortOrder();
  const isSorted = _sortType === sortType && sortOrder !== "none";
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant={isSorted === false ? "ghost" : "default"}
        size="icon"
        onClick={() => {
          if (sortType === _sortType) {
            if (sortOrder === "none") {
              setSortOrder("asc");
            } else if (sortOrder === "asc") {
              setSortOrder("desc");
            } else {
              setSortOrder("none");
            }
          } else {
            setSortOrder("asc");
          }
          setSortType(_sortType);
        }}
      >
        {!isSorted ? (
          <ArrowUpDown className="h-4 w-4" />
        ) : sortOrder === "asc" ? (
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
  freeUntil:
    | {
        hour: number;
        minute: number;
      }
    | null
    | "eod";
  classEndTime: {
    hour: number;
    minute: number;
  } | null;
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
        <SortButton column={column} sortType="venue" />
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <div className="flex items-center gap-2">
        Status
        <div className="flex items-center flex-row gap-0">
          <SortButton column={column} sortType="status" />
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
        <SortButton column={column} sortType="freeUntil" />
      </div>
    ),
    cell: ({ row }) => {
      if (row.original.freeUntil === "eod") {
        return (
          <div className="flex items-center gap-2 text-green-500 font-medium">
            End of Day
          </div>
        );
      }
      return (
        <div className="flex items-center gap-2">
          {row.original.freeUntil
            ? formatTime(
                row.original.freeUntil.hour,
                row.original.freeUntil.minute
              )
            : ""}
        </div>
      );
    },
  },
  {
    accessorKey: "classEndTime",
    header: ({ column }) => (
      <div className="flex items-center gap-2">
        Class Ends At
        <SortButton column={column} sortType="classEndTime" />
      </div>
    ),
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2">
          {row.original.classEndTime
            ? formatTime(
                row.original.classEndTime.hour,
                row.original.classEndTime.minute
              )
            : ""}
        </div>
      );
    },
  },
  {
    accessorKey: "area",
    header: ({ column }) => (
      <div className="flex items-center gap-2">
        Area
        <SortButton column={column} sortType="area" />
      </div>
    ),
  },
  {
    accessorKey: "location",
    header: ({ column }) => (
      <div className="flex items-center gap-2">
        Location
        <SortButton column={column} sortType="location" />
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

const colSpans = [1, 1, 1, 1, 1, 2];

export function VacantTable({ data }: { data: Venues[] }) {
  // const [sorting, setSorting] = useState<SortingState>([]);
  // const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const fuse = useMemo(() => {
    return new Fuse(data, {
      keys: ["venue", "area", "location"],
    });
  }, [data]);

  const [hideVacancy] = useHideVacancy();
  const [search] = useQueryState("search");
  const [sortType] = useSortType();
  const [sortOrder] = useSortOrder();

  const filteredData = useMemo(() => {
    let _data = data;
    if (search) {
      _data = fuse.search(search).map((r) => r.item);
    }
    return _data
      .filter((d) => {
        if (hideVacancy.includes("vacant") && d.status === "vacant") {
          return false;
        }
        if (hideVacancy.includes("inUse") && d.status === "in use") {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortOrder === "none") {
          return 0;
        }
        const sortMultiplier = sortOrder === "asc" ? 1 : -1;
        if (sortType === "venue") {
          return a.venue.localeCompare(b.venue) * sortMultiplier;
        }
        if (sortType === "status") {
          return a.status.localeCompare(b.status) * sortMultiplier;
        }
        if (sortType === "freeUntil") {
          // Order of precedence in DESCENDING.
          // 1. EOD
          // 2. Based on freeUntil hour * 60 + minute
          // 3. Null
          if (a.freeUntil && b.freeUntil) {
            if (a.freeUntil === "eod" && b.freeUntil === "eod") {
              return 0;
            }
            if (a.freeUntil === "eod") {
              return 1 * sortMultiplier;
            }
            if (b.freeUntil === "eod") {
              return -1 * sortMultiplier;
            }

            // Compare by time (hour/minute)
            const aMinutes = a.freeUntil.hour * 60 + a.freeUntil.minute;
            const bMinutes = b.freeUntil.hour * 60 + b.freeUntil.minute;
            return (aMinutes - bMinutes) * sortMultiplier;
          }

          // Handle nulls
          if (a.freeUntil && !b.freeUntil) {
            return 1 * sortMultiplier;
          }
          if (!a.freeUntil && b.freeUntil) {
            return -1 * sortMultiplier;
          }

          return 0;
        }
        if (sortType === "classEndTime") {
          if (a.classEndTime === null && b.classEndTime !== null) {
            return -1 * sortMultiplier;
          }
          if (a.classEndTime !== null && b.classEndTime === null) {
            return sortMultiplier;
          }
          if (a.classEndTime && b.classEndTime) {
            return (
              (a.classEndTime.hour * 60 +
                a.classEndTime.minute -
                (b.classEndTime.hour * 60 + b.classEndTime.minute)) *
              sortMultiplier
            );
          }
          return 0;
        }
        if (sortType === "area") {
          return a.area.localeCompare(b.area) * sortMultiplier;
        }
        if (sortType === "location") {
          return a.location.localeCompare(b.location) * sortMultiplier;
        }
        return 0;
      });
  }, [fuse, search, hideVacancy, sortType, sortOrder]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    // onSortingChange: setSorting,
    // onColumnFiltersChange: setColumnFilters,
    // getSortedRowModel: getSortedRowModel(),
    // getFilteredRowModel: getFilteredRowModel(),
    // state: {
    //   sorting,
    //   columnFilters,
    // },
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
