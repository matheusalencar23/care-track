import type { Key, ReactNode } from "react";
import Skeleton from "./skeleton";

export interface TableColumn<T> {
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
}

interface Props<T> {
  caption: string;
  columns: TableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => Key;
  isLoading?: boolean;
  loadingRows?: number;
}

export const rowLinkClassName =
  "after:absolute after:inset-0 after:content-[''] focus:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-white/40";

const cellClassName =
  "flex items-start justify-between gap-4 px-4 py-1.5 text-sm before:shrink-0 before:text-slate-300 before:content-[attr(data-label)] sm:table-cell sm:py-3 sm:before:content-none";

export default function Table<T>({
  caption,
  columns,
  rows,
  getRowKey,
  isLoading = false,
  loadingRows = 5,
}: Props<T>) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/10 shadow-2xl backdrop-blur-2xl">
      <table className="w-full text-left text-white" aria-busy={isLoading}>
        <caption className="sr-only">{caption}</caption>

        <thead className="sr-only sm:not-sr-only">
          <tr className="border-b border-white/10">
            {columns.map((column) => (
              <th
                key={column.header}
                scope="col"
                className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-300 ${column.className ?? ""}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {isLoading
            ? Array.from({ length: loadingRows }, (_, index) => (
                <tr
                  key={index}
                  className="block border-b border-white/10 py-2 last:border-b-0 sm:table-row sm:py-0"
                >
                  {columns.map((column) => (
                    <td
                      key={column.header}
                      className="block px-4 py-2 sm:table-cell sm:py-4"
                    >
                      <Skeleton className="h-4 w-full max-w-40" />
                    </td>
                  ))}
                </tr>
              ))
            : rows.map((row) => (
                <tr
                  key={getRowKey(row)}
                  className="group relative block border-b border-white/10 py-2 transition-colors last:border-b-0 hover:bg-white/5 sm:table-row sm:py-0"
                >
                  {columns.map((column) => (
                    <td
                      key={column.header}
                      data-label={column.header}
                      className={`${cellClassName} ${column.className ?? ""}`}
                    >
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}
