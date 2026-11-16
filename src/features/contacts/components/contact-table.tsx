"use client";

import { useRouter } from "next/navigation";
import { Edit3, Eye, MoreHorizontal } from "lucide-react";

import { ConsentBadge } from "@/components/shared/consent-badge";
import { ContactAvatar } from "@/components/shared/contact-avatar";
import { ProviderBadge } from "@/components/shared/provider-badge";
import { SourceIcon, sourceLabel } from "@/components/shared/source-icon";
import { TagBadgeList } from "@/components/shared/tag-badge";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { contactProviderKinds } from "@/features/contacts/utils/contact-identity";
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

const COLUMNS = [
  "Contact Name",
  "Customer Name",
  "Providers",
  "Email",
  "Subscription",
  "Tags",
  "Company",
  "City",
  "Source",
  "Last Interaction",
  "Created At",
  "Actions",
];

export function ContactTable({
  contacts,
  selectedIds,
  onSelectionChange,
  onRowClick,
  onView,
  onEdit,
  onDelete,
}: {
  contacts: Contact[];
  /** Ids of contacts ticked for a bulk action; omit (with onSelectionChange) to hide selection. */
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  onRowClick: (contact: Contact) => void;
  onView?: (contact: Contact) => void;
  onEdit?: (contact: Contact) => void;
  onDelete?: (contact: Contact) => void;
}) {
  const router = useRouter();
  const selectable = Boolean(selectedIds && onSelectionChange);
  const allSelected = contacts.length > 0 && contacts.every((c) => selectedIds?.has(c.id));
  const someSelected = !allSelected && contacts.some((c) => selectedIds?.has(c.id));

  function toggle(id: string, checked: boolean) {
    const next = new Set(selectedIds);
    if (!onSelectionChange) return;
    if (checked) next.add(id);
    else next.delete(id);
    onSelectionChange(next);
  }

  return (
    <DataTable className="rounded-none border-0">
      <DataTableHead>
        <DataTableRow>
          {selectable ? (
          <DataTableHeaderCell className="w-10">
            <input
              type="checkbox"
              aria-label="Select all contacts on this page"
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = someSelected;
              }}
              onChange={(e) => onSelectionChange?.(e.target.checked ? new Set(contacts.map((c) => c.id)) : new Set())}
            />
          </DataTableHeaderCell>
          ) : null}
          {COLUMNS.map((column) => (
            <DataTableHeaderCell key={column} className="whitespace-nowrap">
              {column}
            </DataTableHeaderCell>
          ))}
        </DataTableRow>
      </DataTableHead>
      <DataTableBody>
        {contacts.map((contact, index) => (
          <DataTableRow
            key={contact.id || `contact-${index}`}
            className="cursor-pointer hover:bg-muted/40"
          >
            {selectable ? (
              <DataTableCell>
                <input
                  type="checkbox"
                  aria-label={`Select ${contact.contact_name}`}
                  checked={Boolean(selectedIds?.has(contact.id))}
                  onChange={(e) => toggle(contact.id, e.target.checked)}
                />
              </DataTableCell>
            ) : null}
            <DataTableCell>
              <button type="button" className="flex items-center gap-3 text-left" onClick={() => onRowClick(contact)}>
                <ContactAvatar name={contact.contact_name} src={contact.avatar_url} />
                <span className="font-medium">{contact.contact_name}</span>
              </button>
            </DataTableCell>
            <DataTableCell className="text-muted-foreground">{contact.customer_name || "—"}</DataTableCell>
            <DataTableCell>
              <div className="flex flex-wrap gap-1">
                {contactProviderKinds(contact).map((provider) => (
                  <ProviderBadge key={provider} provider={provider} compact />
                ))}
              </div>
            </DataTableCell>
            <DataTableCell className="text-muted-foreground">{contact.email ?? "—"}</DataTableCell>
            <DataTableCell><ConsentBadge status={contact.consent_status} /></DataTableCell>
            <DataTableCell><TagBadgeList tags={contact.tags} /></DataTableCell>
            <DataTableCell className="text-muted-foreground">{contact.company ?? "—"}</DataTableCell>
            <DataTableCell className="text-muted-foreground">{contact.city ?? "—"}</DataTableCell>
            <DataTableCell>
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-muted-foreground">
                <SourceIcon source={contact.source} />
                {sourceLabel(contact.source)}
              </span>
            </DataTableCell>
            <DataTableCell className="whitespace-nowrap text-muted-foreground">{formatActivity(contact.last_activity_at)}</DataTableCell>
            <DataTableCell className="whitespace-nowrap text-muted-foreground">{formatCreated(contact.created_at)}</DataTableCell>
            <DataTableCell>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => (onView ?? onRowClick)(contact)} aria-label={`View ${contact.contact_name}`}>
                  <Eye className="h-4 w-4" />
                </Button>
                {onEdit ? (
                  <Button variant="ghost" size="sm" onClick={() => onEdit(contact)} aria-label={`Edit ${contact.contact_name}`}>
                    <Edit3 className="h-4 w-4" />
                  </Button>
                ) : null}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" aria-label={`More actions for ${contact.contact_name}`}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onSelect={() => router.push(`/inbox?contact=${contact.id}`)}>Open in Inbox</DropdownMenuItem>
                    {onDelete ? (
                      <DropdownMenuItem destructive onSelect={() => onDelete(contact)}>Delete Contact</DropdownMenuItem>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </DataTableCell>
          </DataTableRow>
        ))}
      </DataTableBody>
    </DataTable>
  );
}
