"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deviceService } from "@/features/devices/services/device.service";
import { inboxService } from "@/features/inbox/services/inbox.service";
import type { Device } from "@/types/device";

interface SendMessageFormProps {
  onSent: () => void;
}

export function SendMessageForm({ onSent }: SendMessageFormProps) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceId, setDeviceId] = useState("");
  const [recipient, setRecipient] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    deviceService
      .list()
      .then((list) => {
        const connected = list.filter((d) => d.status === "connected");
        setDevices(connected);
        if (connected.length > 0) {
          setDeviceId(connected[0].id);
        }
      })
      .catch(() => setDevices([]));
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await inboxService.sendMessage({
        device_id: deviceId,
        recipient: recipient.trim(),
        content: content.trim(),
      });
      setContent("");
      onSent();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setLoading(false);
    }
  }

  if (devices.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        Connect a Meta WhatsApp device before sending messages.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-card p-4">
      <div className="space-y-1">
        <h2 className="text-sm font-medium">Send WhatsApp message</h2>
        <p className="text-xs text-muted-foreground">Recipient must be in international format without + (e.g. 628123456789).</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="inbox-device">Device</Label>
        <select
          id="inbox-device"
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

      <div className="space-y-2">
        <Label htmlFor="inbox-recipient">Recipient</Label>
        <Input
          id="inbox-recipient"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="628123456789"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="inbox-content">Message</Label>
        <textarea
          id="inbox-content"
          className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type your message..."
          required
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Sending..." : "Send"}
      </Button>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </form>
  );
}
