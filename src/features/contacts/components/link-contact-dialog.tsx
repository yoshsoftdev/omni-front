"use client";

import { useEffect, useState } from "react";
import { ArrowLeftRight, Search } from "lucide-react";

import { ContactAvatar } from "@/components/shared/contact-avatar";
import { ProviderBadge } from "@/components/shared/provider-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { contactService } from "@/features/contacts/services/contact.service";
import type { Contact } from "@/types/contact";

export function LinkContactDialog({
  target,
  onClose,
  onLinked,
}: {
  target: Contact;
  onClose: () => void;
  onLinked: () => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Contact[]>([]);
  const [selected, setSelected] = useState<Contact | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const value = query.trim();
    if (value.length < 2) {
      setResults([]);
      return;
    }
    const linkedIDs = new Set((target.linked_contacts ?? []).map((item) => item.id));
    const timer = window.setTimeout(() => {
      void contactService.list({ search: value, page_size: 10 }).then(({ items }) => {
        setResults(
          items.filter((item) => item.id !== target.id && !linkedIDs.has(item.id)),
        );
      });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query, target.id, target.linked_contacts]);

  async function confirm() {
    if (!selected) return;
    setSaving(true);
    try {
      await contactService.linkContact(target.id, selected.id);
      await onLinked();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl border bg-card p-5 shadow-xl">
        <h3 className="font-semibold">Link Contact</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Search by phone, display name, or username. Both contacts remain independent.
        </p>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-9"
            placeholder="Search contacts"
          />
        </div>
        <div className="mt-3 max-h-52 space-y-2 overflow-y-auto">
          {results.map((contact) => (
            <button
              type="button"
              key={contact.id}
              onClick={() => setSelected(contact)}
              className="flex w-full items-center gap-3 rounded-lg border p-3 text-left hover:bg-accent"
            >
              <ContactAvatar name={contact.contact_name} src={contact.avatar_url} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{contact.contact_name}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {contact.phone || contact.email || "No contact identity"}
                </div>
              </div>
              <div className="flex gap-1">
                {(contact.providers ?? []).map((profile) => (
                  <ProviderBadge key={profile.id} provider={profile.provider} compact />
                ))}
              </div>
            </button>
          ))}
        </div>

        {selected ? (
          <div className="mt-4 rounded-lg border bg-muted/20 p-3 text-sm">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div>
                <div className="text-xs font-medium text-muted-foreground">Current Contact</div>
                <div className="mt-1 font-medium">{target.contact_name}</div>
              </div>
              <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
              <div className="text-right">
                <div className="text-xs font-medium text-muted-foreground">Linked Contact</div>
                <div className="mt-1 font-medium">{selected.contact_name}</div>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Provider profiles, conversations, messages, and CRM fields will not move.
            </p>
          </div>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!selected || saving} onClick={() => void confirm()}>
            {saving ? "Linking..." : "Confirm Link"}
          </Button>
        </div>
      </div>
    </div>
  );
}
