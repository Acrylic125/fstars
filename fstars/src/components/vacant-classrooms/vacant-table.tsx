"use client";

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
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Input } from "../ui/input";

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
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
        size="sm"
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
        <SortButton column={column} />
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
];

const colSpans = [3, 2, 3];

export function VacantTable({ data }: { data: Venues[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const table = useReactTable({
    data,
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
      <div className="flex items-center gap-2">
        <Input
          type="text"
          placeholder="Search Venue"
          className="w-full max-w-md"
          value={(table.getColumn("venue")?.getFilterValue() as string) ?? ""}
          onChange={(e) => {
            table.getColumn("venue")?.setFilterValue(e.target.value);
          }}
        />
      </div>
      <div className="overflow-hidden rounded-md border">
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
