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
import type { ContactSegment } from "@/types/segment";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function SegmentTable({
  segments,
  onDelete,
}: {
  segments: ContactSegment[];
  onDelete: (id: string) => void;
}) {
  return (
    <DataTable className="rounded-none border-0">
      <DataTableHead>
          <DataTableRow>
            <DataTableHeaderCell>Segment Name</DataTableHeaderCell>
            <DataTableHeaderCell>Description</DataTableHeaderCell>
            <DataTableHeaderCell>Contact Count</DataTableHeaderCell>
            <DataTableHeaderCell>Last Updated</DataTableHeaderCell>
            <DataTableHeaderCell>Actions</DataTableHeaderCell>
          </DataTableRow>
      </DataTableHead>
      <DataTableBody>
          {segments.map((segment, index) => (
            <DataTableRow key={segment.id || `segment-${index}`} className="hover:bg-muted/40">
              <DataTableCell>
                <Link href={`/contacts/segments/${segment.id}`} className="inline-flex items-center gap-2 font-medium hover:underline">
                  <ColorDot color={segment.color} className="h-2.5 w-2.5" />
                  {segment.name}
                </Link>
              </DataTableCell>
              <DataTableCell className="text-muted-foreground">{segment.description}</DataTableCell>
              <DataTableCell>{segment.contact_count.toLocaleString()}</DataTableCell>
              <DataTableCell className="text-muted-foreground">{formatDate(segment.updated_at)}</DataTableCell>
              <DataTableCell>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/contacts/segments/${segment.id}`} aria-label={`View ${segment.name}`}><Eye className="h-4 w-4" /></Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/contacts/segments/${segment.id}`} aria-label={`Edit ${segment.name}`}><Edit3 className="h-4 w-4" /></Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!segment.id}
                    onClick={() => segment.id && onDelete(segment.id)}
                    aria-label={`Delete ${segment.name}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </DataTableCell>
            </DataTableRow>
          ))}
      </DataTableBody>
    </DataTable>
  );
}
