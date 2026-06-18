"use client";

import Link from "next/link";
import { Edit3, Eye, MoreHorizontal, Trash2 } from "lucide-react";

import { ColorDot } from "@/components/shared/color-dot";
import { Button } from "@/components/ui/button";
import type { ContactTag } from "@/types/contact";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function TagTable({
  tags,
  onDelete,
  onMore,
}: {
  tags: ContactTag[];
  onDelete: (id: string) => void;
  onMore?: (tag: ContactTag) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="p-4 font-medium">Tag Name</th>
            <th className="p-4 font-medium">Description</th>
            <th className="p-4 font-medium">Contact Count</th>
            <th className="p-4 font-medium">Last Updated</th>
            <th className="p-4 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tags.map((tag) => (
            <tr key={tag.id} className="border-b last:border-0 hover:bg-muted/40">
              <td className="p-4">
                <Link href={`/contacts/tags/${tag.id}`} className="inline-flex items-center gap-2 font-medium hover:underline">
                  <ColorDot color={tag.color} className="h-2.5 w-2.5" />
                  {tag.name}
                </Link>
              </td>
              <td className="p-4 text-muted-foreground">{tag.description}</td>
              <td className="p-4">{tag.contact_count.toLocaleString()}</td>
              <td className="p-4 text-muted-foreground">{formatDate(tag.updated_at)}</td>
              <td className="p-4">
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/contacts/tags/${tag.id}`}><Eye className="h-4 w-4" /></Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/contacts/tags/${tag.id}`}><Edit3 className="h-4 w-4" /></Link>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDelete(tag.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onMore?.(tag)}>
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
