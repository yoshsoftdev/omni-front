"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { channelQueryService } from "@/features/channels/services/channel-query.service";
import type { Channel } from "@/features/channels/types/channel";
import { inboxService } from "@/features/inbox/services/inbox.service";

interface SendMessageFormProps {
  onSent: () => void;
}

export function SendMessageForm({ onSent }: SendMessageFormProps) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelId, setChannelId] = useState("");
  const [recipient, setRecipient] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    channelQueryService
      .getConnectedChannels()
      .then((list) => {
        setChannels(list);
        if (list.length > 0) {
          setChannelId(list[0].id);
        }
      })
      .catch(() => setChannels([]));
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await inboxService.sendMessage({
        device_id: channelId,
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

  if (channels.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        No channels found. Connect a Meta WhatsApp channel before sending messages.
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
        <Label htmlFor="inbox-channel">Channel</Label>
        <select
          id="inbox-channel"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={channelId}
          onChange={(e) => setChannelId(e.target.value)}
          required
        >
          {channels.map((channel) => (
            <option key={channel.id} value={channel.id}>
              {channel.label} {channel.phone_number ? `(${channel.phone_number})` : ""}
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
