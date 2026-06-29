"use client";

import { useRouter } from "next/navigation";
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

function formatCreated(date: string) {
  return new Date(date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function ContactTable({
  contacts,
  onRowClick,
  onView,
  onEdit,
  onDelete,
}: {
  contacts: Contact[];
  onRowClick: (contact: Contact) => void;
  onView?: (contact: Contact) => void;
  onEdit?: (contact: Contact) => void;
  onDelete?: (contact: Contact) => void;
}) {
  const router = useRouter();

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1200px] text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="p-4 font-medium">Name</th>
            <th className="p-4 font-medium">WhatsApp</th>
            <th className="p-4 font-medium">Email</th>
            <th className="p-4 font-medium">Subscription</th>
            <th className="p-4 font-medium">Tags</th>
            <th className="p-4 font-medium">Company</th>
            <th className="p-4 font-medium">City</th>
            <th className="p-4 font-medium">Source</th>
            <th className="p-4 font-medium">Last Interaction</th>
            <th className="p-4 font-medium">Created At</th>
            <th className="p-4 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact, index) => (
            <tr
              key={contact.id || `contact-${index}`}
              className="cursor-pointer border-b last:border-0 hover:bg-muted/40"
              onClick={() => onRowClick(contact)}
            >
              <td className="p-4">
                <div className="flex items-center gap-3">
                  <ContactAvatar name={contact.name} />
                  <span className="font-medium">{contact.name}</span>
                </div>
              </td>
              <td className="p-4 text-muted-foreground">{contact.phone}</td>
              <td className="p-4 text-muted-foreground">{contact.email ?? "—"}</td>
              <td className="p-4"><ConsentBadge status={contact.consent_status} /></td>
              <td className="p-4"><TagBadgeList tags={contact.tags} /></td>
              <td className="p-4 text-muted-foreground">{contact.company ?? "—"}</td>
              <td className="p-4 text-muted-foreground">{contact.city ?? "—"}</td>
              <td className="p-4">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <SourceIcon source={contact.source} />
                  {sourceLabel(contact.source)}
                </span>
              </td>
              <td className="p-4 text-muted-foreground">{formatActivity(contact.last_activity_at)}</td>
              <td className="p-4 text-muted-foreground">{formatCreated(contact.created_at)}</td>
              <td className="p-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => (onView ?? onRowClick)(contact)} title="View">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onEdit?.(contact)} title="Edit">
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <div className="relative">
                    <select
                      className="absolute inset-0 cursor-pointer opacity-0"
                      defaultValue=""
                      onChange={(e) => {
                        const action = e.target.value;
                        e.target.value = "";
                        if (action === "inbox") {
                          router.push(`/inbox?contact=${contact.id}`);
                        } else if (action === "delete") {
                          onDelete?.(contact);
                        }
                      }}
                    >
                      <option value="" disabled>More</option>
                      <option value="inbox">Open in Inbox</option>
                      <option value="delete">Delete Contact</option>
                    </select>
                    <Button variant="ghost" size="sm" title="More actions">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
