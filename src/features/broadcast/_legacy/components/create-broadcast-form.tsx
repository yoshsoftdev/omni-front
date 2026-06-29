"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { campaignService, templateService } from "@/features/broadcast/services/broadcast.service";
import { contactService } from "@/features/contacts/services/contact.service";
import { tagService } from "@/features/contacts/services/tag.service";
import { deviceService } from "@/features/devices/services/device.service";
import { CONTACT_FIELD_OPTIONS } from "@/types/broadcast";
import type { Contact } from "@/types/contact";
import type { Device } from "@/types/device";
import type { Tag } from "@/types/tag";
import type { WhatsAppTemplate } from "@/types/broadcast";

interface CreateBroadcastFormProps {
  onCreated: () => void;
}

function countBodyVariables(template: WhatsAppTemplate | undefined) {
  if (!template || !Array.isArray(template.components)) return 0;
  let max = 0;
  for (const component of template.components as Array<{ type?: string; text?: string }>) {
    if (component.type !== "BODY" && component.type !== "body") continue;
    const matches = component.text?.match(/\{\{(\d+)\}\}/g) ?? [];
    for (const match of matches) {
      const num = Number(match.replace(/\D/g, ""));
      if (num > max) max = num;
    }
  }
  return max;
}

export function CreateBroadcastForm({ onCreated }: CreateBroadcastFormProps) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [name, setName] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [variableMap, setVariableMap] = useState<Record<string, string>>({});
  const [contactIds, setContactIds] = useState<string[]>([]);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTemplate = useMemo(
    () => templates.find((item) => item.id === templateId),
    [templates, templateId],
  );
  const variableCount = countBodyVariables(selectedTemplate);

  useEffect(() => {
    Promise.all([deviceService.list(), contactService.list(), tagService.list()]).then(
      ([deviceList, contactList, tagList]) => {
        const connected = deviceList.filter((d) => d.status === "connected");
        setDevices(connected);
        setContacts(contactList.items);
        setTags(tagList);
        if (connected.length > 0) setDeviceId(connected[0].id);
      },
    );
  }, []);

  useEffect(() => {
    if (!deviceId) {
      setTemplates([]);
      setTemplateId("");
      return;
    }
    templateService.list({ device_id: deviceId }).then((items) => {
      const approved = items.filter((item) => (item.status ?? "").toUpperCase() === "APPROVED");
      setTemplates(approved.length > 0 ? approved : items);
      setTemplateId("");
    });
  }, [deviceId]);

  useEffect(() => {
    const next: Record<string, string> = {};
    for (let i = 1; i <= variableCount; i += 1) {
      next[String(i)] = variableMap[String(i)] ?? "name";
    }
    setVariableMap(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variableCount, templateId]);

  function toggleContact(id: string) {
    setContactIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  function toggleTag(id: string) {
    setTagIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const campaign = await campaignService.create({
        name: name.trim(),
        device_id: deviceId,
        template_id: templateId,
        variable_mapping: { body: variableMap },
        contact_ids: contactIds,
        tag_ids: tagIds,
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      });

      if (!scheduledAt) {
        await campaignService.send(campaign.id);
      }

      setName("");
      setContactIds([]);
      setTagIds([]);
      setScheduledAt("");
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create campaign");
    } finally {
      setLoading(false);
    }
  }

  if (devices.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        Connect a Meta WhatsApp device before creating a template campaign.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-card p-4">
      <h2 className="text-sm font-medium">New template campaign</h2>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="campaign-name">Campaign name</Label>
          <Input id="campaign-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="campaign-device">Device (WABA)</Label>
          <select
            id="campaign-device"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            required
          >
            {devices.map((device) => (
              <option key={device.id} value={device.id}>
                {device.name} {device.phone_number ? `(${device.phone_number})` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="campaign-template">Approved template</Label>
        <select
          id="campaign-template"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
          required
        >
          <option value="">Select template</option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name} ({template.language})
            </option>
          ))}
        </select>
        {templates.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sync templates from Meta before creating a campaign.</p>
        ) : null}
      </div>

      {variableCount > 0 ? (
        <div className="space-y-2">
          <Label>Variable mapping</Label>
          <div className="grid gap-2 md:grid-cols-2">
            {Array.from({ length: variableCount }, (_, index) => {
              const key = String(index + 1);
              return (
                <div key={key} className="flex items-center gap-2">
                  <span className="w-12 text-xs text-muted-foreground">{`{{${key}}}`}</span>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                    value={variableMap[key] ?? "name"}
                    onChange={(e) =>
                      setVariableMap((prev) => ({
                        ...prev,
                        [key]: e.target.value,
                      }))
                    }
                  >
                    {CONTACT_FIELD_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="campaign-schedule">Schedule (optional)</Label>
        <Input
          id="campaign-schedule"
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
        />
      </div>

      {contacts.length > 0 ? (
        <div className="space-y-2">
          <Label>Contacts</Label>
          <div className="max-h-40 overflow-y-auto rounded-md border p-2">
            {contacts.map((contact) => (
              <label key={contact.id} className="flex items-center gap-2 py-1 text-sm">
                <input
                  type="checkbox"
                  checked={contactIds.includes(contact.id)}
                  onChange={() => toggleContact(contact.id)}
                />
                {contact.name} ({contact.phone})
              </label>
            ))}
          </div>
        </div>
      ) : null}

      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              className="rounded-full px-3 py-1 text-xs font-medium"
              style={{
                backgroundColor: tagIds.includes(tag.id) ? tag.color : "transparent",
                color: tagIds.includes(tag.id) ? "#fff" : tag.color,
                border: `1px solid ${tag.color}`,
              }}
            >
              {tag.name}
            </button>
          ))}
        </div>
      ) : null}

      <Button type="submit" disabled={loading || !templateId}>
        {loading ? "Creating..." : scheduledAt ? "Schedule campaign" : "Create & send"}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </form>
  );
}
