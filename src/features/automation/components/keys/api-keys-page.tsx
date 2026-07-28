"use client";

import { KeyRound, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AutomationNav } from "@/features/automation/components/automation-nav";
import { CopyButton } from "@/features/automation/components/shared/copy-button";
import { apiKeyService } from "@/features/automation/services/api-key.service";
import type { ApiKeyScope, AutomationApiKey } from "@/features/automation/types/api-key";
import { formatRelativeTime, maskApiKey } from "@/features/automation/utils/format";
import { useToast } from "@/hooks/use-toast";

const SCOPE_OPTIONS: Array<{ value: ApiKeyScope; label: string; available: boolean }> = [
  { value: "send_template", label: "send_template", available: true },
  { value: "send_text", label: "send_text", available: true },
  { value: "contacts.read", label: "contacts.read", available: false },
  { value: "endpoints.invoke", label: "endpoints.invoke", available: false },
];

export function ApiKeysPage() {
  const { notify, Toast } = useToast();
  const [keys, setKeys] = useState<AutomationApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [secretModal, setSecretModal] = useState<{ name: string; secret: string } | null>(null);
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<ApiKeyScope[]>(["send_template"]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setKeys(await apiKeyService.list());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate() {
    if (!name.trim()) {
      notify("error", "Key name is required");
      return;
    }
    setSaving(true);
    try {
      const result = await apiKeyService.create({ name, scopes });
      setCreateOpen(false);
      setName("");
      setScopes(["send_template"]);
      setSecretModal({ name: result.key.name, secret: result.secret });
      notify("success", "API key created");
      void load();
    } finally {
      setSaving(false);
    }
  }

  async function handleRotate(id: string) {
    if (!window.confirm("Rotate this key? The old secret will stop working immediately.")) return;
    const result = await apiKeyService.rotate(id);
    setSecretModal({ name: result.key.name, secret: result.secret });
    notify("success", "API key rotated");
    void load();
  }

  async function handleToggle(key: AutomationApiKey) {
    if (key.status === "active") {
      await apiKeyService.disable(key.id);
      notify("success", "API key disabled");
    } else {
      await apiKeyService.enable(key.id);
      notify("success", "API key enabled");
    }
    void load();
  }

  async function handleDelete(key: AutomationApiKey) {
    if (!window.confirm(`Delete API key "${key.name}"?`)) return;
    await apiKeyService.remove(key.id);
    notify("success", "API key deleted");
    void load();
  }

  return (
    <div className="space-y-6">
      <AutomationNav />
      <PageHeader
        title="API Keys"
        description="Named Automation keys with scopes. Each key can be rotated or disabled independently."
        right={
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Create key
          </Button>
        }
      />

      <div className="rounded-lg border bg-card">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        ) : keys.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <KeyRound className="h-8 w-8 text-muted-foreground" />
            <p className="font-medium">No API keys yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Create a named key for each integration (ERP, n8n, staging).
            </p>
            <Button type="button" onClick={() => setCreateOpen(true)}>
              Create key
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Key</th>
                  <th className="px-4 py-3 font-medium">Scopes</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Last used</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {keys.map((key) => (
                  <tr key={key.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{key.name}</td>
                    <td className="px-4 py-3">
                      <code className="font-mono text-xs">{maskApiKey(key.keyPrefix)}</code>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {key.scopes.map((scope) => (
                          <StatusBadge key={scope} tone="neutral">
                            {scope}
                          </StatusBadge>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={key.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatRelativeTime(key.lastUsedAt)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatRelativeTime(key.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => void handleRotate(key.id)}>
                          Rotate
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => void handleToggle(key)}>
                          {key.status === "active" ? "Disable" : "Enable"}
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => void handleDelete(key)}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {createOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md space-y-4 rounded-lg border bg-card p-5 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold">Create API key</h2>
              <p className="text-sm text-muted-foreground">The secret is shown only once after creation.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="key-name">Name</Label>
              <Input
                id="key-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ERP, n8n, Staging…"
              />
            </div>
            <div className="space-y-2">
              <Label>Scopes</Label>
              <div className="space-y-2 rounded-md border p-3">
                {SCOPE_OPTIONS.map((scope) => (
                  <label key={scope.value} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={scopes.includes(scope.value)}
                      disabled={!scope.available}
                      onChange={(e) => {
                        setScopes((prev) =>
                          e.target.checked
                            ? [...prev, scope.value]
                            : prev.filter((item) => item !== scope.value),
                        );
                      }}
                    />
                    <span className={!scope.available ? "text-muted-foreground" : undefined}>
                      {scope.label}
                      {!scope.available ? " (Coming soon)" : null}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="button" disabled={saving} onClick={() => void handleCreate()}>
                {saving ? "Creating…" : "Create"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {secretModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md space-y-4 rounded-lg border bg-card p-5 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold">Save your API key</h2>
              <p className="text-sm text-muted-foreground">
                Copy the secret for <strong>{secretModal.name}</strong>. You will not be able to see it again.
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
