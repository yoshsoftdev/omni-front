"use client";

import { Button } from "@/components/ui/button";
import { ProviderBadge } from "@/components/shared/provider-badge";
import { contactService } from "@/features/contacts/services/contact.service";
import { contactProviderKinds } from "@/features/contacts/utils/contact-identity";
import { useAuthStore } from "@/store/auth-store";
import type { Contact } from "@/types/contact";

interface ContactsTableProps {
  contacts: Contact[];
  onChanged: () => void;
}

export function ContactsTable({ contacts, onChanged }: ContactsTableProps) {
  const role = useAuthStore((state) => state.role);
  const canManage = role === "owner" || role === "admin";

  async function handleDelete(contact: Contact) {
    if (!confirm(`Delete contact "${contact.contact_name}"?`)) return;
    await contactService.remove(contact.id);
    onChanged();
  }

  if (contacts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        No contacts found.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Name</th>
            <th className="px-4 py-3 text-left font-medium">Providers</th>
            <th className="px-4 py-3 text-left font-medium">Tags</th>
            {canManage ? <th className="px-4 py-3 text-right font-medium">Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact) => (
            <tr key={contact.id} className="border-t">
              <td className="px-4 py-3">
                <div className="font-medium">{contact.contact_name}</div>
                {contact.email ? <div className="text-xs text-muted-foreground">{contact.email}</div> : null}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {contactProviderKinds(contact).map((provider) => (
                    <ProviderBadge key={provider} provider={provider} compact />
                  ))}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {contact.tags?.map((tag) => (
                    <span
                      key={tag.id}
                      className="rounded-full px-2 py-0.5 text-xs"
                      style={{ backgroundColor: `${tag.color}22`, color: tag.color }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </td>
              {canManage ? (
                <td className="px-4 py-3 text-right">
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(contact)}>
                    Delete
                  </Button>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
