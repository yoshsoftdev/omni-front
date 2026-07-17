"use client";

import { useRouter } from "next/navigation";
import { Link2, MessageSquare, Split, Unlink } from "lucide-react";

import { ContactAvatar } from "@/components/shared/contact-avatar";
import { ProviderBadge, SourceOfTruthBadge } from "@/components/shared/provider-badge";
import { Button } from "@/components/ui/button";
import { contactService } from "@/features/contacts/services/contact.service";
import type { ProviderProfile } from "@/types/contact";

type ProviderDetail = {
  label: string;
  value: string;
};

function metadataString(profile: ProviderProfile, ...keys: string[]) {
  for (const key of keys) {
    let value: unknown = profile.metadata;
    for (const part of key.split(".")) {
      if (!value || typeof value !== "object") {
        value = undefined;
        break;
      }
      value = (value as Record<string, unknown>)[part];
    }
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return undefined;
}

function providerDetails(profile: ProviderProfile): ProviderDetail[] {
  const rows: ProviderDetail[] = [];
  const add = (label: string, value?: string) => {
    rows.push({ label, value: value?.trim() || "Not Available" });
  };

  add("Display Name", profile.display_name);

  if (profile.provider === "whatsapp") {
    add("Phone Number", profile.phone);
    add("WhatsApp ID", profile.provider_user_id);
    add(
      "Business Number",
      metadataString(
        profile,
        "business_number",
        "business_name",
        "verified_name",
        "channel_name",
      ),
    );
  } else if (profile.provider === "instagram") {
    add("Username", profile.username ? `@${profile.username.replace(/^@/, "")}` : undefined);
    add("Instagram User ID", profile.provider_user_id);
    add("Account Type", metadataString(profile, "account_type", "accountType"));
  } else if (profile.provider === "messenger") {
    add("Messenger ID (PSID)", profile.provider_user_id);
    add(
      "Facebook Page",
      metadataString(profile, "facebook_page", "page_name", "page.name"),
    );
    add("Locale", metadataString(profile, "locale"));
  } else {
    add("Username", profile.username ? `@${profile.username.replace(/^@/, "")}` : undefined);
    add("Phone", profile.phone);
    add("Email", profile.email);
    add("Provider ID", profile.provider_user_id);
  }

  return rows;
}

export function ContactChannels({
  contactId,
  profiles,
  onLink,
  onRefresh,
}: {
  contactId: string;
  profiles: ProviderProfile[];
  onLink: () => void;
  onRefresh: () => Promise<void>;
}) {
  const router = useRouter();

  async function separateChannel(profile: ProviderProfile) {
    const confirmed = window.confirm(
      `Separate this ${profile.provider} channel into its own contact? Conversation history will remain unchanged.`,
    );
    if (!confirmed) return;
    await contactService.unlinkProvider(profile.id);
    await onRefresh();
  }

  async function makeSource(profile: ProviderProfile) {
    await contactService.setSourceOfTruth(profile.id);
    await onRefresh();
  }

  async function unlinkContact(profile: ProviderProfile) {
    const confirmed = window.confirm(
      `Unlink this ${profile.provider} channel from the current contact? Channel ownership and conversation history will remain unchanged.`,
    );
    if (!confirmed) return;
    await contactService.unlinkContact(contactId, profile.contact_id);
    await onRefresh();
  }

  function connectionLabel(profile: ProviderProfile) {
    return profile.status === "active" ? "Connected" : "Not Connected";
  }

  return (
    <section>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Linked Accounts</h4>
        <Button variant="outline" size="sm" onClick={onLink}>
          <Link2 className="mr-1.5 h-3.5 w-3.5" />
          Link Contact
        </Button>
      </div>
      <div className="mt-3 space-y-2">
        {profiles.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
            No linked accounts.
          </p>
        ) : profiles.map((profile) => (
          <div key={profile.id} className="rounded-lg border p-3">
            <div className="flex flex-wrap items-center gap-2">
              <ProviderBadge provider={profile.provider} />
              {profile.is_source_of_truth ? <SourceOfTruthBadge /> : null}
              <span className="ml-auto text-[10px] text-muted-foreground">
                {connectionLabel(profile)}
              </span>
            </div>
            <div className="mt-3 space-y-3 text-xs">
              {providerDetails(profile).map((detail) => (
                <div key={detail.label}>
                  <div className="text-muted-foreground">{detail.label}</div>
                  <div className="mt-0.5 break-all text-sm">{detail.value}</div>
                </div>
              ))}
              {profile.provider === "instagram" || profile.provider === "messenger" ? (
                <div>
                  <div className="text-muted-foreground">Profile Picture</div>
                  <div className="mt-1">
                    {profile.avatar_url ? (
                      <ContactAvatar
                        name={profile.display_name || profile.username || profile.provider}
                        src={profile.avatar_url}
                        size="sm"
                      />
                    ) : (
                      <span className="text-sm">Not Available</span>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.conversation_ids?.[0] ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(`/inbox?conversation=${profile.conversation_ids![0]}`)}
                >
                  <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                  Open Conversation
                </Button>
              ) : null}
              {profile.contact_id === contactId
                && profile.provider === "whatsapp"
                && !profile.is_source_of_truth ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void makeSource(profile)}
                >
                  Set Main Account
                </Button>
              ) : null}
              {profile.contact_id === contactId ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => void separateChannel(profile)}
                >
                  <Split className="mr-1.5 h-3.5 w-3.5" />
                  Separate Contact
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => void unlinkContact(profile)}
                >
                  <Unlink className="mr-1.5 h-3.5 w-3.5" />
                  Unlink Contact
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
