"use client";

import { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function DataTable({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-lg border bg-card", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">{children}</table>
      </div>
    </div>
  );
}

export function DataTableHead({ children }: { children: ReactNode }) {
  return <thead className="border-b bg-muted/40">{children}</thead>;
}

export function DataTableBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function DataTableRow({ children, className }: { children: ReactNode; className?: string }) {
  return <tr className={cn("border-b last:border-b-0", className)}>{children}</tr>;
}

export function DataTableHeaderCell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function DataTableCell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <td className={cn("px-4 py-3 align-middle", className)}>{children}</td>;
}

export function DataTableEmpty({ message }: { message: string }) {
  return (
    <tr>
      <td colSpan={99} className="px-4 py-12 text-center text-sm text-muted-foreground">
        {message}
      </td>
    </tr>
  );
}
