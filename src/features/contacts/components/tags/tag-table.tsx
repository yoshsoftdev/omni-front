"use client";

import Link from "next/link";
import { Edit3, Eye, Trash2 } from "lucide-react";

import { ColorDot } from "@/components/shared/color-dot";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import type { ContactTag } from "@/types/contact";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function TagTable({
  tags,
  onDelete,
}: {
  tags: ContactTag[];
  /** Omit to hide Delete (no permission). */
  onDelete?: (id: string) => void;
}) {
  return (
    <DataTable className="rounded-none border-0">
      <DataTableHead>
          <DataTableRow>
            <DataTableHeaderCell>Tag Name</DataTableHeaderCell>
            <DataTableHeaderCell>Description</DataTableHeaderCell>
            <DataTableHeaderCell>Contact Count</DataTableHeaderCell>
            <DataTableHeaderCell>Last Updated</DataTableHeaderCell>
            <DataTableHeaderCell>Actions</DataTableHeaderCell>
          </DataTableRow>
      </DataTableHead>
      <DataTableBody>
          {tags.map((tag, index) => (
            <DataTableRow key={tag.id || `tag-${index}`} className="hover:bg-muted/40">
              <DataTableCell>
                <Link href={`/contacts/tags/${tag.id}`} className="inline-flex items-center gap-2 font-medium hover:underline">
                  <ColorDot color={tag.color} className="h-2.5 w-2.5" />
                  {tag.name}
                </Link>
              </DataTableCell>
              <DataTableCell className="text-muted-foreground">{tag.description}</DataTableCell>
              <DataTableCell>{tag.contact_count.toLocaleString()}</DataTableCell>
              <DataTableCell className="text-muted-foreground">{formatDate(tag.updated_at)}</DataTableCell>
              <DataTableCell>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/contacts/tags/${tag.id}`} aria-label={`View ${tag.name}`}><Eye className="h-4 w-4" /></Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/contacts/tags/${tag.id}`} aria-label={`Edit ${tag.name}`}><Edit3 className="h-4 w-4" /></Link>
                  </Button>
                  {onDelete ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!tag.id}
                    onClick={() => tag.id && onDelete?.(tag.id)}
                    aria-label={`Delete ${tag.name}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                  ) : null}
                </div>
              </DataTableCell>
            </DataTableRow>
          ))}
      </DataTableBody>
    </DataTable>
  );
}
