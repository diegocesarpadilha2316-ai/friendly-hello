import * as React from "react";
import { cn } from "@/lib/utils";
import { EmptyState } from "./empty-state";

export interface DataTableColumn<T> {
  id: string;
  header: React.ReactNode;
  cell: (row: T, index: number) => React.ReactNode;
  align?: "left" | "right" | "center";
  width?: string;
  className?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowKey?: (row: T, index: number) => React.Key;
  onRowClick?: (row: T) => void;
  empty?: React.ReactNode;
  className?: string;
}

const ALIGN: Record<NonNullable<DataTableColumn<unknown>["align"]>, string> = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

export function DataTable<T>({
  columns,
  data,
  getRowKey,
  onRowClick,
  empty,
  className,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <>{empty ?? <EmptyState title="Sem dados" description="Nenhum registro encontrado." />}</>
    );
  }
  return (
    <div className={cn("overflow-hidden rounded-lg border border-border bg-card", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.id}
                  scope="col"
                  style={col.width ? { width: col.width } : undefined}
                  className={cn(
                    "px-4 py-3 text-xs font-medium uppercase tracking-wide",
                    ALIGN[col.align ?? "left"],
                    col.className,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((row, i) => (
              <tr
                key={getRowKey ? getRowKey(row, i) : i}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "transition-colors",
                  onRowClick && "cursor-pointer hover:bg-accent/40",
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.id}
                    className={cn(
                      "px-4 py-3 text-foreground",
                      ALIGN[col.align ?? "left"],
                      col.className,
                    )}
                  >
                    {col.cell(row, i)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
