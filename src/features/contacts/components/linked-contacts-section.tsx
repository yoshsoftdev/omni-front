"use client";

import { Link2, Unlink } from "lucide-react";

import { ContactAvatar } from "@/components/shared/contact-avatar";
import { ProviderBadge } from "@/components/shared/provider-badge";
import { Button } from "@/components/ui/button";
import { contactService } from "@/features/contacts/services/contact.service";
import type { LinkedContact } from "@/types/contact";

export function LinkedContactsSection({
  contactId,
  linkedContacts,
  onLink,
  onOpenContact,
  onRefresh,
}: {
  contactId: string;
  linkedContacts: LinkedContact[];
  onLink: () => void;
  onOpenContact: (linkedContactId: string) => void;
  onRefresh: () => Promise<void>;
}) {
  async function unlink(peer: LinkedContact) {
    const confirmed = window.confirm(
      `Remove link to ${peer.contact_name}? Neither contact's data or channels will change.`,
    );
    if (!confirmed) return;
    await contactService.unlinkContact(contactId, peer.id);
    await onRefresh();
  }

  return (
    <section>
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold">Linked Contacts</h4>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Shortcuts only — linked contacts stay independent.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onLink}>
          <Link2 className="mr-1.5 h-3.5 w-3.5" />
          Link Contact
        </Button>
      </div>
      <div className="mt-3 space-y-2">
        {linkedContacts.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
            No linked contacts.
          </p>
        ) : (
          linkedContacts.map((peer) => (
            <div key={peer.link_id} className="rounded-lg border p-3">
              <div className="flex items-start gap-3">
                <ContactAvatar
                  name={peer.contact_name}
                  src={peer.avatar_url}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{peer.contact_name}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {peer.phone || peer.email || "No contact identity"}
                  </div>
                  {peer.provider_kinds?.length ? (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {peer.provider_kinds.map((kind) => (
                        <ProviderBadge key={kind} provider={kind} compact />
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => onOpenContact(peer.id)}>
                  Open Contact
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => void unlink(peer)}
                >
                  <Unlink className="mr-1.5 h-3.5 w-3.5" />
                  Unlink
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
