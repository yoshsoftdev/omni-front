"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { useConfirm } from "@/components/shared/confirm-dialog";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from "@/components/shared/data-table";
import { EmptyState, ErrorState } from "@/components/shared/empty-state";
import { FilterSelect } from "@/components/shared/filter-bar";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { SettingsNav } from "@/features/settings/components/settings-nav";
import { autoReplyService } from "@/features/settings/services/auto-reply.service";
import {
  AUTO_REPLY_MAX_CHARS,
  parseKeywords,
  type KeywordMatchType,
  type KeywordRule,
  type WelcomeSettings,
} from "@/features/settings/types/auto-reply";
import { usePermission } from "@/features/team/hooks/use-permission";
import { useToast } from "@/hooks/use-toast";
import { PERM } from "@/lib/permissions";
import { formatApiErrorMessage } from "@/services/api/errors";

const MATCH_OPTIONS = [
  { value: "contains", label: "Contains the keyword" },
  { value: "exact", label: "Is exactly the keyword" },
];

const textareaClass =
  "w-full rounded-md border border-input bg-background p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60";

type RuleDraft = { id?: string; keywords: string; match_type: KeywordMatchType; reply_text: string; enabled: boolean; sort_order: number };

export function AutoReplySettingsPage() {
  const { notify, Toast } = useToast();
  const [confirm, confirmDialog] = useConfirm();
  const { can } = usePermission();
  const canUpdate = can(PERM.automationUpdate);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [welcome, setWelcome] = useState<WelcomeSettings>({ enabled: false, text: "" });
  const [savingWelcome, setSavingWelcome] = useState(false);
  const [rules, setRules] = useState<KeywordRule[]>([]);
  const [draft, setDraft] = useState<RuleDraft | null>(null);
  const [savingRule, setSavingRule] = useState(false);

  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    Promise.all([autoReplyService.getWelcome(), autoReplyService.listRules()])
      .then(([w, r]) => {
        setWelcome(w);
        setRules(r);
      })
      // Never show an editable empty form after a failed load: saving it would wipe the real settings.
      .catch((err) => setLoadError(formatApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [attempt]);

  async function saveWelcome() {
    if (welcome.enabled && !welcome.text.trim()) {
      notify("error", "Write the welcome message before turning it on");
      return;
    }
    setSavingWelcome(true);
    try {
      setWelcome(await autoReplyService.updateWelcome(welcome));
      notify("success", "Welcome message saved");
    } catch (err) {
      notify("error", formatApiErrorMessage(err));
    } finally {
      setSavingWelcome(false);
    }
  }

  async function saveRule() {
    if (!draft) return;
    const input = {
      keywords: parseKeywords(draft.keywords),
      match_type: draft.match_type,
      reply_text: draft.reply_text.trim(),
      enabled: draft.enabled,
      sort_order: draft.sort_order,
    };
    if (input.keywords.length === 0 || !input.reply_text) {
      notify("error", "Add at least one keyword and a reply");
      return;
    }
    setSavingRule(true);
    try {
      if (draft.id) {
        const updated = await autoReplyService.updateRule(draft.id, input);
        setRules((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      } else {
        const created = await autoReplyService.createRule(input);
        setRules((prev) => [...prev, created].sort((a, b) => a.sort_order - b.sort_order));
      }
      setDraft(null);
      notify("success", "Keyword reply saved");
    } catch (err) {
      notify("error", formatApiErrorMessage(err));
    } finally {
      setSavingRule(false);
    }
  }

  async function deleteRule(rule: KeywordRule) {
    const ok = await confirm({
      title: "Delete keyword reply?",
      description: `Messages containing "${rule.keywords[0]}" will no longer get an automatic answer.`,
    });
    if (!ok) return;
    try {
      await autoReplyService.deleteRule(rule.id);
      setRules((prev) => prev.filter((r) => r.id !== rule.id));
      notify("success", "Keyword reply deleted");
    } catch (err) {
      notify("error", formatApiErrorMessage(err));
    }
  }

  function openNew() {
    const nextOrder = rules.reduce((max, r) => Math.max(max, r.sort_order), 0) + 1;
    setDraft({ keywords: "", match_type: "contains", reply_text: "", enabled: true, sort_order: nextOrder });
  }

  return (
    <div className="space-y-6">
      <Toast />
      {confirmDialog}
      <PageHeader
        title="Auto Reply"
        description="Answer customers automatically. Auto-replies stop for 24 hours once an agent replies in the conversation."
      />
      <SettingsNav />

      {loading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Loading auto reply settings">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-56 w-full rounded-xl" />
        </div>
      ) : loadError ? (
        <ErrorState message={loadError} onRetry={() => setAttempt((n) => n + 1)} />
      ) : (
        <>
          <section className="space-y-4 rounded-xl border bg-card p-5 shadow-sm" aria-labelledby="welcome-heading">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="welcome-heading" className="font-semibold">Welcome message</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sent once, when a customer messages a channel for the first time.
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={welcome.enabled}
                  disabled={!canUpdate}
                  onChange={(e) => setWelcome({ ...welcome, enabled: e.target.checked })}
                />
                Enabled
              </label>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="welcome-text">Message</Label>
              <textarea
                id="welcome-text"
                rows={4}
                maxLength={AUTO_REPLY_MAX_CHARS}
                readOnly={!canUpdate}
                className={textareaClass}
                placeholder="Halo! Terima kasih sudah menghubungi kami. Tim kami akan segera membalas."
                value={welcome.text}
                onChange={(e) => setWelcome({ ...welcome, text: e.target.value })}
              />
              <p className="text-right text-xs text-muted-foreground">
                {welcome.text.length}/{AUTO_REPLY_MAX_CHARS}
              </p>
            </div>
            {canUpdate ? (
              <div className="flex justify-end">
                <Button onClick={() => void saveWelcome()} disabled={savingWelcome}>
                  {savingWelcome ? "Saving..." : "Save welcome message"}
                </Button>
              </div>
            ) : null}
          </section>

          <section className="rounded-xl border bg-card shadow-sm" aria-labelledby="keywords-heading">
            <div className="flex items-start justify-between gap-4 p-5">
              <div>
                <h2 id="keywords-heading" className="font-semibold">Keyword replies</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  The first enabled rule that matches a customer&apos;s text message sends its reply. Case and punctuation
                  are ignored.
                </p>
              </div>
              {can(PERM.automationCreate) ? (
                <Button onClick={openNew}>
                  <Plus className="h-4 w-4" />
                  Add keyword reply
                </Button>
              ) : null}
            </div>
            {rules.length === 0 ? (
              <EmptyState message="No keyword replies yet." className="m-5 mt-0" />
            ) : (
              <DataTable className="rounded-none border-x-0 border-b-0">
                <DataTableHead>
                  <DataTableRow>
                    <DataTableHeaderCell>Order</DataTableHeaderCell>
                    <DataTableHeaderCell>Keywords</DataTableHeaderCell>
                    <DataTableHeaderCell>Match</DataTableHeaderCell>
                    <DataTableHeaderCell>Reply</DataTableHeaderCell>
                    <DataTableHeaderCell>Status</DataTableHeaderCell>
                    <DataTableHeaderCell>
                      <span className="sr-only">Actions</span>
                    </DataTableHeaderCell>
                  </DataTableRow>
                </DataTableHead>
                <DataTableBody>
                  {rules.map((rule) => (
                    <DataTableRow key={rule.id}>
                      <DataTableCell className="tabular-nums">{rule.sort_order}</DataTableCell>
                      <DataTableCell className="font-medium">{rule.keywords.join(", ")}</DataTableCell>
                      <DataTableCell className="text-muted-foreground">
                        {rule.match_type === "exact" ? "Exact" : "Contains"}
                      </DataTableCell>
                      <DataTableCell className="max-w-xs truncate text-muted-foreground" title={rule.reply_text}>
                        {rule.reply_text}
                      </DataTableCell>
                      <DataTableCell>
                        <StatusBadge tone={rule.enabled ? "success" : "neutral"}>{rule.enabled ? "On" : "Off"}</StatusBadge>
                      </DataTableCell>
                      <DataTableCell>
                        <div className="flex justify-end gap-1">
                          {canUpdate ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label={`Edit keyword reply ${rule.keywords[0]}`}
                              onClick={() =>
                                setDraft({
                                  id: rule.id,
                                  keywords: rule.keywords.join(", "),
                                  match_type: rule.match_type,
                                  reply_text: rule.reply_text,
                                  enabled: rule.enabled,
                                  sort_order: rule.sort_order,
                                })
                              }
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          ) : null}
                          {can(PERM.automationDelete) ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label={`Delete keyword reply ${rule.keywords[0]}`}
                              onClick={() => void deleteRule(rule)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          ) : null}
                        </div>
                      </DataTableCell>
                    </DataTableRow>
                  ))}
                </DataTableBody>
              </DataTable>
            )}
          </section>
        </>
      )}

      <Dialog open={draft !== null} onOpenChange={(open) => !open && !savingRule && setDraft(null)}>
        <DialogContent className="max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit keyword reply" : "Add keyword reply"}</DialogTitle>
          </DialogHeader>
          {draft ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="rule-keywords">Keywords</Label>
                <Input
                  id="rule-keywords"
                  placeholder="harga, price list, berapa"
                  value={draft.keywords}
                  onChange={(e) => setDraft({ ...draft, keywords: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Separate keywords with commas (up to 20).</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="rule-match">Match</Label>
                  <FilterSelect
                    id="rule-match"
                    label="Match"
                    value={draft.match_type}
                    onChange={(value) => setDraft({ ...draft, match_type: value as KeywordMatchType })}
                    options={MATCH_OPTIONS}
                    className="w-full"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rule-order">Order</Label>
                  <Input
                    id="rule-order"
                    type="number"
                    min={0}
                    value={draft.sort_order}
                    onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rule-reply">Reply</Label>
                <textarea
                  id="rule-reply"
                  rows={5}
                  maxLength={AUTO_REPLY_MAX_CHARS}
                  className={textareaClass}
                  value={draft.reply_text}
                  onChange={(e) => setDraft({ ...draft, reply_text: e.target.value })}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.enabled}
                  onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })}
                />
                Enabled
              </label>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" disabled={savingRule} onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button disabled={savingRule} onClick={() => void saveRule()}>
              {savingRule ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
