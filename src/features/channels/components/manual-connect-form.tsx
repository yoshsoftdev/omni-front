"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { channelCommandService } from "@/features/channels/services/channel-command.service";
import type { ManualVerifyResult } from "@/features/channels/services/channels-api.service";

interface ManualConnectFormProps {
  onConnected: () => void;
}

export function ManualConnectForm({ onConnected }: ManualConnectFormProps) {
  const [name, setName] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [wabaId, setWabaId] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [verified, setVerified] = useState(false);
  const [verifyResult, setVerifyResult] = useState<ManualVerifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function resetVerification() {
    setVerified(false);
    setVerifyResult(null);
  }

  function handleCredentialChange<T>(setter: (value: T) => void, value: T) {
    setter(value);
    resetVerification();
    setError(null);
  }

  const credentials = {
    access_token: accessToken.trim(),
    waba_id: wabaId.trim(),
    phone_number_id: phoneNumberId.trim(),
  };

  async function handleTestConnection() {
    setError(null);
    setTesting(true);
    try {
      const result = await channelCommandService.verifyManualConnection(credentials);
      setVerifyResult(result);
      setVerified(true);
    } catch (err) {
      resetVerification();
      setError(err instanceof Error ? err.message : "Connection test failed");
    } finally {
      setTesting(false);
    }
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!verified) {
      setError("Test the connection before saving the channel.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await channelCommandService.createManualConnection({
        name: name.trim(),
        ...credentials,
        phone_number: phoneNumber.trim(),
        business_id: businessId.trim() || undefined,
      });
      onConnected();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect channel");
    } finally {
      setSaving(false);
    }
  }

  const credentialsReady =
    credentials.access_token !== "" &&
    credentials.waba_id !== "" &&
    credentials.phone_number_id !== "";

  return (
    <form onSubmit={handleSave} className="space-y-4 rounded-lg border bg-card p-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold">Manual WhatsApp Connection</h2>
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-700">
            Advanced
          </span>
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-700">
            Developer
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Test credentials against Meta first, then save the channel once verification succeeds.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="channel-name">Channel Name</Label>
        <Input
          id="channel-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Sales WhatsApp"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="business-id">Business ID</Label>
        <Input
          id="business-id"
          value={businessId}
          onChange={(e) => setBusinessId(e.target.value)}
          placeholder="123456789012345"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="access-token">System User Token</Label>
        <Input
          id="access-token"
          type="password"
          value={accessToken}
          onChange={(e) => handleCredentialChange(setAccessToken, e.target.value)}
          placeholder="EAA..."
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="waba-id">WABA ID</Label>
        <Input
          id="waba-id"
          value={wabaId}
          onChange={(e) => handleCredentialChange(setWabaId, e.target.value)}
          placeholder="987654321098765"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone-number-id">Phone Number ID</Label>
        <Input
          id="phone-number-id"
          value={phoneNumberId}
          onChange={(e) => handleCredentialChange(setPhoneNumberId, e.target.value)}
          placeholder="123456789012345"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone-number">Phone Number</Label>
        <Input
          id="phone-number"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="+628123456789"
          required
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleTestConnection}
          disabled={testing || saving || !credentialsReady}
        >
          {testing ? "Testing..." : "Test Connection"}
        </Button>
        <Button type="submit" disabled={saving || testing || !verified || !name.trim()}>
          {saving ? "Saving..." : "Save Channel"}
        </Button>
      </div>

      {verified && verifyResult ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-sm dark:border-emerald-900 dark:bg-emerald-950/30">
          <div className="flex items-start gap-2 text-emerald-800 dark:text-emerald-200">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">Connection verified</p>
              <p className="mt-1 text-emerald-700 dark:text-emerald-300">
                {verifyResult.waba_name ?? "WABA"} · {verifyResult.phone_display ?? "Phone number"} ·{" "}
                {verifyResult.template_count} template(s) accessible
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </form>
  );
}
