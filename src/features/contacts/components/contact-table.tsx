"use client";

import { Edit3, Eye, MoreHorizontal } from "lucide-react";

import { ConsentBadge } from "@/components/shared/consent-badge";
import { ContactAvatar } from "@/components/shared/contact-avatar";
import { SourceIcon, sourceLabel } from "@/components/shared/source-icon";
import { TagBadgeList } from "@/components/shared/tag-badge";
import { Button } from "@/components/ui/button";
import type { Contact } from "@/types/contact";

function formatActivity(date?: string) {
  if (!date) return "—";
  const d = new Date(date);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return `Today, ${d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function ContactTable({
  contacts,
  onRowClick,
  onView,
  onEdit,
  onMore,
}: {
  contacts: Contact[];
  onRowClick: (contact: Contact) => void;
  onView?: (contact: Contact) => void;
  onEdit?: (contact: Contact) => void;
  onMore?: (contact: Contact) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="w-10 p-4"><input type="checkbox" /></th>
            <th className="p-4 font-medium">Name</th>
            <th className="p-4 font-medium">Phone</th>
            <th className="p-4 font-medium">Email</th>
            <th className="p-4 font-medium">Source</th>
            <th className="p-4 font-medium">Tags</th>
            <th className="p-4 font-medium">Consent Status</th>
            <th className="p-4 font-medium">Last Activity</th>
            <th className="p-4 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact) => (
            <tr
              key={contact.id}
              className="cursor-pointer border-b last:border-0 hover:bg-muted/40"
              onClick={() => onRowClick(contact)}
            >
              <td className="p-4" onClick={(e) => e.stopPropagation()}>
                <input type="checkbox" />
              </td>
              <td className="p-4">
                <div className="flex items-center gap-3">
                  <ContactAvatar name={contact.name} />
                  <span className="font-medium">{contact.name}</span>
                </div>
              </td>
              <td className="p-4 text-muted-foreground">{contact.phone}</td>
              <td className="p-4 text-muted-foreground">{contact.email ?? "—"}</td>
              <td className="p-4">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <SourceIcon source={contact.source} />
                  {sourceLabel(contact.source)}
                </span>
              </td>
              <td className="p-4"><TagBadgeList tags={contact.tags} /></td>
              <td className="p-4"><ConsentBadge status={contact.consent_status} /></td>
              <td className="p-4 text-muted-foreground">{formatActivity(contact.last_activity_at)}</td>
              <td className="p-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => (onView ?? onRowClick)(contact)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onEdit?.(contact)}>
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onMore?.(contact)}>
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
