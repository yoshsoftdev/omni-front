"use client";

import { ChevronDown, ChevronRight, Plus, Webhook } from "lucide-react";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/shared/alert";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AutomationNav } from "@/features/automation/components/automation-nav";
import { CopyButton } from "@/features/automation/components/shared/copy-button";
import { webhookService } from "@/features/automation/services/webhook.service";
import type { ForwardDelivery, ForwardWebhook } from "@/features/automation/types/webhook";
import { formatRelativeTime } from "@/features/automation/utils/format";
import { channelQueryService } from "@/features/channels/services/channel-query.service";
import type { Channel } from "@/features/channels/types/channel";
import { useToast } from "@/hooks/use-toast";
import { formatApiErrorMessage } from "@/services/api/errors";

type EditorState = {
  mode: "create" | "edit";
  id?: string;
  name: string;
  url: string;
  channelId: string;
  rotateSecret: boolean;
};

const EXAMPLE_PAYLOAD = `{
  "event": "message.received",
  "occurredAt": "2026-07-27T10:00:00Z",
  "teamId": "…",
  "channelId": "…",
  "channelType": "whatsapp",
  "conversationId": "…",
  "contact": { "id": "…", "phone": "+628…", "contactName": "…" },
  "message": {
    "id": "…",
    "direction": "inbound",
    "contentType": "text",
    "content": "halo",
    "createdAt": "2026-07-27T10:00:00Z"
  }
}`;

function isValidWebhookUrl(value: string): boolean {
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function channelLabel(channels: Channel[], channelId?: string | null): string {
  if (!channelId) return "All channels";
  const found = channels.find((ch) => ch.id === channelId);
  if (!found) return channelId.slice(0, 8) + "…";
  return found.label || found.phone_number || found.id;
}

export function WebhooksPage() {
  const { notify, Toast } = useToast();
  const [webhooks, setWebhooks] = useState<ForwardWebhook[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [saving, setSaving] = useState(false);
  const [secretModal, setSecretModal] = useState<{ name: string; secret: string } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<Record<string, ForwardDelivery[]>>({});
  const [loadingDeliveries, setLoadingDeliveries] = useState<string | null>(null);

  const loadWebhooks = useCallback(async () => {
    setLoading(true);
    try {
      const hooks = await webhookService.list();
      setWebhooks(hooks);
    } catch (err) {
      notify("error", formatApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [notify]);

  const loadChannels = useCallback(async () => {
    try {
      // Include all channels for filter (inbound can arrive on any linked channel).
      const list = await channelQueryService.getChannels();
      setChannels(list);
    } catch (err) {
      notify("error", formatApiErrorMessage(err));
    }
  }, [notify]);

  useEffect(() => {
    void loadWebhooks();
    void loadChannels();
  }, [loadWebhooks, loadChannels]);

  const activeCount = useMemo(
    () => webhooks.filter((item) => item.status === "active").length,
    [webhooks],
  );

  function openCreate() {
    setEditor({
      mode: "create",
      name: "",
      url: "",
      channelId: "",
      rotateSecret: true,
    });
  }

  function openEdit(item: ForwardWebhook) {
    setEditor({
      mode: "edit",
      id: item.id,
      name: item.name,
      url: item.url,
      channelId: item.channelId ?? "",
      rotateSecret: false,
    });
  }

  async function handleSave() {
    if (!editor) return;
    if (!editor.name.trim()) {
      notify("error", "Name is required");
      return;
    }
    if (!isValidWebhookUrl(editor.url)) {
      notify("error", "Enter a valid http(s) URL");
      return;
    }

    setSaving(true);
    try {
      const channelId = editor.channelId.trim() || null;
      if (editor.mode === "create") {
        const created = await webhookService.create({
          name: editor.name.trim(),
          url: editor.url.trim(),
          events: ["message.received"],
          channelId,
        });
        setEditor(null);
        notify("success", "Webhook registered");
        if (created.secret) {
          setSecretModal({ name: created.name, secret: created.secret });
        }
      } else if (editor.id) {
        const updated = await webhookService.update(editor.id, {
          name: editor.name.trim(),
          url: editor.url.trim(),
          rotateSecret: editor.rotateSecret,
          channelId: channelId || undefined,
          clearChannel: !channelId,
        });
        setEditor(null);
        notify("success", "Webhook updated");
        if (editor.rotateSecret && updated.secret) {
          setSecretModal({ name: updated.name, secret: updated.secret });
        }
      }
      void loadWebhooks();
    } catch (err) {
      notify("error", formatApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(item: ForwardWebhook) {
    try {
      if (item.status === "active") {
        await webhookService.disable(item.id);
        notify("success", "Webhook disabled");
      } else {
        await webhookService.enable(item.id);
        notify("success", "Webhook enabled");
      }
      void loadWebhooks();
    } catch (err) {
      notify("error", formatApiErrorMessage(err));
    }
  }

  async function handleDelete(item: ForwardWebhook) {
    if (!window.confirm(`Delete webhook "${item.name}"? Inbound messages will stop being forwarded.`)) {
      return;
    }
    try {
      await webhookService.remove(item.id);
      notify("success", "Webhook deleted");
      void loadWebhooks();
    } catch (err) {
      notify("error", formatApiErrorMessage(err));
    }
  }

  async function toggleDeliveries(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (deliveries[id]) return;
    setLoadingDeliveries(id);
    try {
      const items = await webhookService.listDeliveries(id);
      setDeliveries((prev) => ({ ...prev, [id]: items }));
    } catch (err) {
      notify("error", formatApiErrorMessage(err));
    } finally {
      setLoadingDeliveries(null);
    }
  }

  return (
    <div className="space-y-6">
      <AutomationNav />
      <PageHeader
        title="Webhooks"
        description="Teruskan pesan masuk (WhatsApp/Instagram) dari Omni Chan ke aplikasi Anda."
        right={
          <Button type="button" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Register webhook
          </Button>
        }
      />

      <Alert variant="info" title="Inbound message forwarding">
        Setiap kali customer mengirim pesan ke Omni Chan, kami POST event{" "}
        <code className="font-mono text-[11px]">message.received</code> ke URL yang Anda daftarkan.
        Ini bukan callback invoke API Automation.
      </Alert>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Cara kerja</p>
          <ol className="mt-2 list-decimal space-y-1 pl-4">
            <li>Customer kirim chat ke nomor/channel Omni Chan</li>
            <li>Pesan masuk ke Inbox</li>
            <li>Omni Chan forward payload ke Forward URL Anda</li>
          </ol>
          <p className="mt-3">
            Active webhooks: <span className="font-medium text-foreground">{activeCount}</span> /{" "}
            {webhooks.length}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Example payload</p>
            <CopyButton value={EXAMPLE_PAYLOAD} label="Copy" />
          </div>
          <pre className="overflow-x-auto rounded-md border bg-muted p-3 font-mono text-[11px] leading-relaxed text-foreground">
            {EXAMPLE_PAYLOAD}
          </pre>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        ) : webhooks.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <Webhook className="h-8 w-8 text-muted-foreground" />
            <p className="font-medium">Belum ada webhook</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Daftarkan URL aplikasi Anda (ERP, n8n, CRM) agar setiap pesan masuk diteruskan otomatis.
            </p>
            <Button type="button" onClick={openCreate}>
              Register webhook
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Forward URL</th>
                  <th className="px-4 py-3 font-medium">Channel</th>
                  <th className="px-4 py-3 font-medium">Event</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Last used</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {webhooks.map((item) => {
                  const expanded = expandedId === item.id;
                  const rows = deliveries[item.id] ?? [];
                  return (
                    <Fragment key={item.id}>
                      <tr className="border-b last:border-0">
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            className="flex items-start gap-1 text-left"
                            onClick={() => void toggleDeliveries(item.id)}
                          >
                            {expanded ? (
                              <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                            )}
                            <span>
                              <span className="block font-medium">{item.name}</span>
                              <code className="font-mono text-[11px] text-muted-foreground">{item.id}</code>
                            </span>
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <code className="break-all font-mono text-xs">{item.url}</code>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {channelLabel(channels, item.channelId)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {(item.events?.length ? item.events : ["message.received"]).map((event) => (
                              <StatusBadge key={event} tone="neutral">
                                {event}
                              </StatusBadge>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatRelativeTime(item.lastUsedAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => openEdit(item)}>
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => void handleToggle(item)}
                            >
                              {item.status === "active" ? "Disable" : "Enable"}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => void handleDelete(item)}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                      {expanded ? (
                        <tr className="border-b bg-muted/20 last:border-0">
                          <td colSpan={7} className="px-4 py-3">
                            <p className="mb-2 text-xs font-medium text-muted-foreground">
                              Recent deliveries
                            </p>
                            {loadingDeliveries === item.id ? (
                              <div className="h-10 animate-pulse rounded-md bg-muted" />
                            ) : rows.length === 0 ? (
                              <p className="text-sm text-muted-foreground">
                                Belum ada delivery. Kirim pesan uji ke channel untuk melihat log.
                              </p>
                            ) : (
                              <div className="overflow-x-auto rounded-md border bg-card">
                                <table className="w-full text-left text-xs">
                                  <thead className="border-b bg-muted/40 text-muted-foreground">
                                    <tr>
                                      <th className="px-3 py-2 font-medium">Time</th>
                                      <th className="px-3 py-2 font-medium">Status</th>
                                      <th className="px-3 py-2 font-medium">HTTP</th>
                                      <th className="px-3 py-2 font-medium">Error</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {rows.map((row) => (
                                      <tr key={row.id} className="border-b last:border-0">
                                        <td className="px-3 py-2 text-muted-foreground">
                                          {formatRelativeTime(row.attemptedAt)}
                                        </td>
                                        <td className="px-3 py-2">
                                          <StatusBadge status={row.status} />
                                        </td>
                                        <td className="px-3 py-2 font-mono">{row.statusCode || "—"}</td>
                                        <td className="px-3 py-2 text-muted-foreground">
                                          {row.errorMessage || "—"}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editor ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg space-y-4 rounded-lg border bg-card p-5 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold">
                {editor.mode === "create" ? "Register webhook" : "Edit webhook"}
              </h2>
              <p className="text-sm text-muted-foreground">
                Omni Chan akan meneruskan pesan inbound ke URL ini.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhook-name">Name</Label>
              <Input
                id="webhook-name"
                value={editor.name}
                onChange={(e) => setEditor((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
                placeholder="ERP, n8n, Billing…"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhook-url">Forward URL</Label>
              <Input
                id="webhook-url"
                value={editor.url}
                onChange={(e) => setEditor((prev) => (prev ? { ...prev, url: e.target.value } : prev))}
                placeholder="https://your-app.example.com/hooks/omni-inbound"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhook-channel">Channel filter (optional)</Label>
              <select
                id="webhook-channel"
                value={editor.channelId}
                onChange={(e) =>
                  setEditor((prev) => (prev ? { ...prev, channelId: e.target.value } : prev))
                }
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">All channels</option>
                {channels.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.label || ch.phone_number || ch.id}
                    {ch.channel_type ? ` · ${ch.channel_type}` : ""}
                    {ch.status !== "connected" ? ` (${ch.status})` : ""}
                  </option>
                ))}
              </select>
              {channels.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Belum ada channel ter-load. Pastikan channel WhatsApp/Instagram sudah terhubung di Devices.
                </p>
              ) : null}
            </div>

            <div className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
              Event: <code className="font-mono text-xs">message.received</code> (pesan masuk saja)
            </div>

            {editor.mode === "edit" ? (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editor.rotateSecret}
                  onChange={(e) =>
                    setEditor((prev) => (prev ? { ...prev, rotateSecret: e.target.checked } : prev))
                  }
                />
                Rotate signing secret
              </label>
            ) : null}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditor(null)}>
                Cancel
              </Button>
              <Button type="button" disabled={saving} onClick={() => void handleSave()}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {secretModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md space-y-4 rounded-lg border bg-card p-5 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold">Signing secret</h2>
              <p className="text-sm text-muted-foreground">
                Verifikasi header <code className="font-mono text-xs">X-Omni-Signature-256</code> untuk{" "}
                <strong>{secretModal.name}</strong>.
              </p>
            </div>
            <code className="block break-all rounded-md border bg-muted p-3 font-mono text-xs">
              {secretModal.secret}
            </code>
            <div className="flex justify-end gap-2">
              <CopyButton value={secretModal.secret} label="Copy secret" />
              <Button type="button" onClick={() => setSecretModal(null)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <Toast />
    </div>
  );
}
