"use client";

import Link from "next/link";
import { Edit3, Eye, MoreHorizontal, Trash2 } from "lucide-react";

import { ColorDot } from "@/components/shared/color-dot";
import { Button } from "@/components/ui/button";
import type { ContactSegment } from "@/types/segment";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function SegmentTable({
  segments,
  onDelete,
  onMore,
}: {
  segments: ContactSegment[];
  onDelete: (id: string) => void;
  onMore?: (segment: ContactSegment) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="p-4 font-medium">Segment Name</th>
            <th className="p-4 font-medium">Description</th>
            <th className="p-4 font-medium">Contact Count</th>
            <th className="p-4 font-medium">Last Updated</th>
            <th className="p-4 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {segments.map((segment) => (
            <tr key={segment.id} className="border-b last:border-0 hover:bg-muted/40">
              <td className="p-4">
                <Link href={`/contacts/segments/${segment.id}`} className="inline-flex items-center gap-2 font-medium hover:underline">
                  <ColorDot color={segment.color} className="h-2.5 w-2.5" />
                  {segment.name}
                </Link>
              </td>
              <td className="p-4 text-muted-foreground">{segment.description}</td>
              <td className="p-4">{segment.contact_count.toLocaleString()}</td>
              <td className="p-4 text-muted-foreground">{formatDate(segment.updated_at)}</td>
              <td className="p-4">
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/contacts/segments/${segment.id}`}><Eye className="h-4 w-4" /></Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/contacts/segments/${segment.id}`}><Edit3 className="h-4 w-4" /></Link>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDelete(segment.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onMore?.(segment)}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
