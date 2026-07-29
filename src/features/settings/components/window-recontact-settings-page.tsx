"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { SettingsNav } from "@/features/settings/components/settings-nav";
import { windowRecontactService } from "@/features/settings/services/window-recontact.service";
import {
  WINDOW_RECONTACT_DEFAULT_TEXT,
  WINDOW_RECONTACT_MAX_HOURS,
  WINDOW_RECONTACT_MIN_HOURS,
  type WindowRecontactSettings,
} from "@/features/settings/types/window-recontact";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function WindowRecontactSettingsPage() {
  const router = useRouter();
  const role = useAuthStore((state) => state.role);
  const canManage = role === "owner" || role === "admin";
  const { notify, Toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [text, setText] = useState(WINDOW_RECONTACT_DEFAULT_TEXT);
  const [afterHours, setAfterHours] = useState(WINDOW_RECONTACT_MAX_HOURS);

  useEffect(() => {
    if (!canManage) {
      router.replace("/inbox");
      return;
    }
    windowRecontactService
      .get()
      .then((settings: WindowRecontactSettings) => {
        setEnabled(settings.enabled);
        setText(settings.text || WINDOW_RECONTACT_DEFAULT_TEXT);
        setAfterHours(settings.after_hours || WINDOW_RECONTACT_MAX_HOURS);
      })
      .catch((error) =>
        notify("error", error instanceof Error ? error.message : "Failed to load settings"),
      )
      .finally(() => setLoading(false));
  }, [canManage, notify, router]);

  async function handleSave() {
    const trimmed = text.trim();
    if (enabled && !trimmed) {
      notify("error", "Default recontact text is required when auto-send is enabled");
      return;
    }
    if (afterHours < WINDOW_RECONTACT_MIN_HOURS || afterHours > WINDOW_RECONTACT_MAX_HOURS) {
      notify(
        "error",
        `Auto-send delay must be between ${WINDOW_RECONTACT_MIN_HOURS} and ${WINDOW_RECONTACT_MAX_HOURS} hours`,
      );
      return;
    }

    setSaving(true);
    try {
      const updated = await windowRecontactService.update({
        enabled,
        text: trimmed || WINDOW_RECONTACT_DEFAULT_TEXT,
        after_hours: afterHours,
      });
      setEnabled(updated.enabled);
      setText(updated.text);
      setAfterHours(updated.after_hours);
      notify("success", "Window recontact settings saved");
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#111111]">Settings</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Auto free-text before the Meta 24-hour messaging window closes.
        </p>
      </div>

      <SettingsNav />

      {loading ? (
        <div className="h-40 animate-pulse rounded-lg border border-[#E5E7EB] bg-white" />
      ) : (
        <div className="max-w-2xl space-y-5 rounded-lg border border-[#E5E7EB] bg-white p-5">
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            When enabled, Omni Chan auto-sends the default text after the configured delay from the
            customer&apos;s last inbound message. Delay max is {WINDOW_RECONTACT_MAX_HOURS} hours so
            the send stays inside the 24-hour free-text window. Agent replies cancel the pending
            auto-send for that window.
          </div>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(event) => setEnabled(event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-[#E5E7EB]"
            />
            <span>
              <span className="block text-sm font-medium text-[#111111]">Enable auto recontact</span>
              <span className="text-xs text-[#6B7280]">
                Send a default free-text message before the messaging window closes.
              </span>
            </span>
          </label>

          <div className="space-y-2">
            <label htmlFor="recontact-hours" className="text-sm font-medium text-[#111111]">
              Auto-send after (hours)
            </label>
            <div className="flex items-center gap-3">
              <input
                id="recontact-hours"
                type="number"
                min={WINDOW_RECONTACT_MIN_HOURS}
                max={WINDOW_RECONTACT_MAX_HOURS}
                value={afterHours}
                onChange={(event) => setAfterHours(Number(event.target.value))}
                className="h-10 w-28 rounded-md border border-[#E5E7EB] bg-white px-3 text-sm"
              />
              <span className="text-xs text-[#6B7280]">
                {WINDOW_RECONTACT_MIN_HOURS}–{WINDOW_RECONTACT_MAX_HOURS} hours after last customer
                message
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="recontact-text" className="text-sm font-medium text-[#111111]">
              Default recontact text
            </label>
            <textarea
              id="recontact-text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={5}
              className={cn(
                "w-full resize-y rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111111]",
              )}
              placeholder={WINDOW_RECONTACT_DEFAULT_TEXT}
            />
          </div>

          <div className="flex justify-end">
            <Button type="button" onClick={() => void handleSave()} disabled={saving}>
              {saving ? "Saving..." : "Save settings"}
            </Button>
          </div>
        </div>
      )}

      <Toast />
    </div>
  );
}
