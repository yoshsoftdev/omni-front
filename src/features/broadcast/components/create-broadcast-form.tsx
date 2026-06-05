"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { broadcastService } from "@/features/broadcast/services/broadcast.service";
import { contactService } from "@/features/contacts/services/contact.service";
import { tagService } from "@/features/contacts/services/tag.service";
import { deviceService } from "@/features/devices/services/device.service";
import type { Contact } from "@/types/contact";
import type { Device } from "@/types/device";
import type { Tag } from "@/types/tag";

interface CreateBroadcastFormProps {
  onCreated: () => void;
}

export function CreateBroadcastForm({ onCreated }: CreateBroadcastFormProps) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [contactIds, setContactIds] = useState<string[]>([]);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      deviceService.list(),
      contactService.list(),
      tagService.list(),
    ]).then(([deviceList, contactList, tagList]) => {
      const connected = deviceList.filter((d) => d.status === "connected");
      setDevices(connected);
      setContacts(contactList);
      setTags(tagList);
      if (connected.length > 0) setDeviceId(connected[0].id);
    });
  }, []);

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
      await broadcastService.create({
        name: name.trim(),
        message: message.trim(),
        device_id: deviceId,
        contact_ids: contactIds,
        tag_ids: tagIds,
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      });
      setName("");
      setMessage("");
      setContactIds([]);
      setTagIds([]);
      setScheduledAt("");
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create broadcast");
    } finally {
      setLoading(false);
    }
  }

  if (devices.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        Connect a Meta WhatsApp device before creating a broadcast campaign.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-card p-4">
      <h2 className="text-sm font-medium">New campaign</h2>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="broadcast-name">Campaign name</Label>
          <Input id="broadcast-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="broadcast-device">Device</Label>
          <select
            id="broadcast-device"
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
        <Label htmlFor="broadcast-message">Message</Label>
        <textarea
          id="broadcast-message"
          className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="broadcast-schedule">Schedule (optional)</Label>
        <Input
          id="broadcast-schedule"
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

      <Button type="submit" disabled={loading}>
        {loading ? "Creating..." : scheduledAt ? "Schedule campaign" : "Send now"}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </form>
  );
}
