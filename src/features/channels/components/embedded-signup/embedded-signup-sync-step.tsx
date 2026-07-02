"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { channelSyncService } from "@/features/channels/services/channel-sync.service";
import { templateService } from "@/features/broadcast/services/broadcast.service";

type EmbeddedSignupSyncStepProps = {
  channelId: string;
  onSkip: () => void;
  onComplete: () => void;
};

export function EmbeddedSignupSyncStep({ channelId, onSkip, onComplete }: EmbeddedSignupSyncStepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSyncNow() {
    setLoading(true);
    setError(null);
    try {
      await channelSyncService.syncContacts(channelId);
      await templateService.sync(channelId);
      await channelSyncService.syncConversations(channelId);
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Synchronization failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 rounded-lg border bg-card p-6">
      <div>
        <h2 className="text-lg font-semibold">Sync Existing Data</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Would you like to synchronize your existing WhatsApp Business data?
        </p>
        <p className="mt-1 text-sm text-muted-foreground">This can also be done later.</p>
        <p className="mt-3 text-xs text-muted-foreground">
          Meta Cloud API does not guarantee complete historical chat import. Conversation synchronization depends
          entirely on what Meta exposes.
        </p>
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => void handleSyncNow()} disabled={loading}>
          {loading ? "Syncing..." : "Sync Now"}
        </Button>
        <Button variant="outline" onClick={onSkip} disabled={loading}>
          Skip
        </Button>
      </div>
    </div>
  );
}
