"use client";

import { useState } from "react";
import { RefreshCw, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { channelSyncService } from "@/features/channels/services/channel-sync.service";
import { templateService } from "@/features/broadcast/services/broadcast.service";
import { useMetaEmbeddedSignup } from "@/features/channels/hooks/use-meta-embedded-signup";
import { embeddedSignupService } from "@/features/channels/services/embedded-signup.service";
import type { ChannelSyncStatus } from "@/features/channels/services/channel-sync.service";

type ChannelSyncSectionProps = {
  channelId: string;
  canManage: boolean;
};

function formatSyncStatus(status?: string) {
  switch (status) {
    case "completed":
      return "Synced";
    case "in_progress":
      return "Syncing";
    case "failed":
      return "Failed";
    default:
      return "Not Synced";
  }
}

function formatPermissionLabel(granted: boolean) {
  return granted ? "Granted" : "Permission Required";
}

export function ChannelSyncSection({ channelId, canManage }: ChannelSyncSectionProps) {
  const { launch, enabled } = useMetaEmbeddedSignup();
  const [status, setStatus] = useState<ChannelSyncStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionPrompt, setPermissionPrompt] = useState(false);

  async function loadStatus() {
    setError(null);
    try {
      const next = await channelSyncService.getStatus(channelId);
      setStatus(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load synchronization status");
    }
  }

  async function ensureLoaded() {
    if (!status && !loading) {
      setLoading(true);
      try {
        await loadStatus();
      } finally {
        setLoading(false);
      }
    }
  }

  async function runSync() {
    if (!canManage) return;
    setLoading(true);
    setError(null);
    setPermissionPrompt(false);
    try {
      await channelSyncService.syncContacts(channelId);
      await templateService.sync(channelId);
      await channelSyncService.syncConversations(channelId);
      await loadStatus();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Synchronization failed";
      if (message.toLowerCase().includes("permission")) {
        setPermissionPrompt(true);
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleReauthorize() {
    if (!enabled) {
      setError("Meta Embedded Signup is not configured on this environment.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const session = await channelSyncService.reauthorize(channelId);
      const launchResult = await launch();
      if (!launchResult.phoneNumberId) {
        throw new Error("Phone Number ID was not received from Meta.");
      }
      await embeddedSignupService.complete(channelId, session.session_id, {
        code: launchResult.code,
        oauth_state: session.oauth_state,
        business_id: launchResult.businessId,
        waba_id: launchResult.wabaId,
        phone_number_id: launchResult.phoneNumberId,
      });
      setPermissionPrompt(false);
      await runSync();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Meta reauthorization failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 rounded-lg border bg-muted/10 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Synchronization</p>
          <p className="text-xs text-muted-foreground">Existing data and Meta permissions for this channel.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void ensureLoaded()} disabled={loading}>
          Refresh
        </Button>
      </div>

      {permissionPrompt ? (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900 dark:bg-amber-950/20">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-4 w-4 text-amber-700" />
            <div className="space-y-2">
              <p className="text-sm font-medium">Additional Meta Permission Required</p>
              <p className="text-xs text-muted-foreground">
                To synchronize contacts and available conversations, Meta requires additional permissions.
                Continue with Meta to grant access.
              </p>
              {canManage ? (
                <Button size="sm" onClick={() => void handleReauthorize()} disabled={loading}>
                  Continue with Meta
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {status ? (
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">Permissions</dt>
            <dd className="font-medium capitalize">{status.permissions}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Last Sync</dt>
            <dd className="font-medium">{status.last_sync_at ? new Date(status.last_sync_at).toLocaleString() : "Never"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Contacts</dt>
            <dd className="font-medium">{formatSyncStatus(status.contacts.status)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Templates</dt>
            <dd className="font-medium">{formatSyncStatus(status.templates.status)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Available Conversations</dt>
            <dd className="font-medium">{formatSyncStatus(status.conversations.status)}</dd>
          </div>
        </dl>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">
          {loading ? "Loading synchronization status..." : "Refresh to view synchronization details."}
        </p>
      )}

      {canManage ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => void runSync()} disabled={loading}>
            <RefreshCw className="mr-1 h-3.5 w-3.5" />
            {loading ? "Syncing..." : "Sync Now"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => void handleReauthorize()} disabled={loading}>
            Check Permissions
          </Button>
        </div>
      ) : null}

      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

export function ChannelPermissionDetails({ channelId }: { channelId: string }) {
  const [permissions, setPermissions] = useState<Awaited<ReturnType<typeof channelSyncService.getPermissions>> | null>(null);

  async function load() {
    const next = await channelSyncService.getPermissions(channelId);
    setPermissions(next);
  }

  return (
    <div className="mt-3 space-y-1 text-xs text-muted-foreground">
      <button type="button" className="text-primary hover:underline" onClick={() => void load()}>
        View permission breakdown
      </button>
      {permissions ? (
        <ul className="space-y-1">
          <li>Contacts: {formatPermissionLabel(permissions.contacts)}</li>
          <li>Templates: {formatPermissionLabel(permissions.templates)}</li>
          <li>Conversation Sync: {formatPermissionLabel(permissions.conversation_sync)}</li>
        </ul>
      ) : null}
    </div>
  );
}
