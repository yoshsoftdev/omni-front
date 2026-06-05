"use client";

import { SendMessageForm } from "@/features/inbox/components/send-message-form";
import { useInboxFeed } from "@/features/inbox/hooks/use-inbox-feed";

export default function InboxPage() {
  const { messages, loading, error, reload } = useInboxFeed();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Inbox</h1>
        <p className="text-sm text-muted-foreground">
          WhatsApp messages via Meta Cloud API — realtime updates over WebSocket.
        </p>
      </div>

      <SendMessageForm onSent={reload} />

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading messages...</p>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : messages.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No messages yet. Incoming WhatsApp messages will appear here after Meta webhook is configured.
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <div key={m.id} className="rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{m.sender}</p>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {m.direction}
                    </span>
                  </div>
                  {m.recipient ? (
                    <p className="text-xs text-muted-foreground">To: {m.recipient}</p>
                  ) : null}
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{m.content}</p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  {m.received_at ? new Date(m.received_at).toLocaleString() : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
