"use client";

import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from "@/components/shared/data-table";
import { KeyRound, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { ErrorState } from "@/components/shared/empty-state";
import { useConfirm } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AutomationNav } from "@/features/automation/components/automation-nav";
import { CopyButton } from "@/features/automation/components/shared/copy-button";
import { apiKeyService } from "@/features/automation/services/api-key.service";
import type { ApiKeyScope, AutomationApiKey } from "@/features/automation/types/api-key";
import { formatRelativeTime, maskApiKey } from "@/features/automation/utils/format";
import { useToast } from "@/hooks/use-toast";
import { formatApiErrorMessage } from "@/services/api/errors";

const SCOPE_OPTIONS: Array<{ value: ApiKeyScope; label: string; available: boolean }> = [
  { value: "send_template", label: "send_template", available: true },
  { value: "send_text", label: "send_text", available: true },
  { value: "contacts.read", label: "contacts.read", available: false },
  { value: "endpoints.invoke", label: "endpoints.invoke", available: false },
];

export function ApiKeysPage() {
  const { notify, Toast } = useToast();
  const [confirm, confirmDialog] = useConfirm();
  const [keys, setKeys] = useState<AutomationApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [secretModal, setSecretModal] = useState<{ name: string; secret: string } | null>(null);
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<ApiKeyScope[]>(["send_template"]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setKeys(await apiKeyService.list());
    } catch (err) {
      setLoadError(formatApiErrorMessage(err));
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
    const ok = await confirm({
      title: "Rotate API key?",
      description: "The old secret stops working immediately; update every client that uses it.",
      confirmLabel: "Rotate",
    });
    if (!ok) return;
    try {
      const result = await apiKeyService.rotate(id);
      setSecretModal({ name: result.key.name, secret: result.secret });
      notify("success", "API key rotated");
      void load();
    } catch (err) {
      notify("error", formatApiErrorMessage(err));
    }
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
    if (!(await confirm({ title: "Delete API key?", description: `Clients using "${key.name}" will get 401.` }))) return;
    try {
      await apiKeyService.remove(key.id);
      notify("success", "API key deleted");
      void load();
    } catch (err) {
      notify("error", formatApiErrorMessage(err));
    }
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
        ) : loadError ? (
          <ErrorState message={loadError} onRetry={() => void load()} className="m-4" />
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
          <DataTable className="">
              <DataTableHead>
                <DataTableRow>
                  <DataTableHeaderCell>Name</DataTableHeaderCell>
                  <DataTableHeaderCell>Key</DataTableHeaderCell>
                  <DataTableHeaderCell>Scopes</DataTableHeaderCell>
                  <DataTableHeaderCell>Status</DataTableHeaderCell>
                  <DataTableHeaderCell>Last used</DataTableHeaderCell>
                  <DataTableHeaderCell>Created</DataTableHeaderCell>
                  <DataTableHeaderCell><span className="sr-only">Actions</span></DataTableHeaderCell>
                </DataTableRow>
              </DataTableHead>
              <DataTableBody>
                {keys.map((key) => (
                  <DataTableRow key={key.id}>
                    <DataTableCell>{key.name}</DataTableCell>
                    <DataTableCell>
                      <code className="font-mono text-xs">{maskApiKey(key.keyPrefix)}</code>
                    </DataTableCell>
                    <DataTableCell>
                      <div className="flex flex-wrap gap-1">
                        {key.scopes.map((scope) => (
                          <StatusBadge key={scope} tone="neutral">
                            {scope}
                          </StatusBadge>
                        ))}
                      </div>
                    </DataTableCell>
                    <DataTableCell>
                      <StatusBadge status={key.status} />
                    </DataTableCell>
                    <DataTableCell className="text-muted-foreground">{formatRelativeTime(key.lastUsedAt)}</DataTableCell>
                    <DataTableCell className="text-muted-foreground">{formatRelativeTime(key.createdAt)}</DataTableCell>
                    <DataTableCell>
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
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTable>
        )}
      </div>

      {createOpen ? (
        <Dialog open onOpenChange={(next) => !next && setCreateOpen(false)}>
          <DialogContent className="max-w-md" aria-describedby={undefined}>
            <div>
              <DialogTitle>Create API key</DialogTitle>
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
          </DialogContent>
        </Dialog>
      ) : null}

      {secretModal ? (
        <Dialog open onOpenChange={() => undefined}>
          <DialogContent className="max-w-md" aria-describedby={undefined} onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()} hideClose>
            <div>
              <DialogTitle>Save your API key</DialogTitle>
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
          </DialogContent>
        </Dialog>
      ) : null}

      {confirmDialog}
      <Toast />
    </div>
  );
}
