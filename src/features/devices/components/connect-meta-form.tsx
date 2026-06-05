"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deviceService } from "@/features/devices/services/device.service";

interface ConnectMetaFormProps {
  deviceId: string;
  onConnected: () => void;
  onCancel: () => void;
}

export function ConnectMetaForm({ deviceId, onConnected, onCancel }: ConnectMetaFormProps) {
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [wabaId, setWabaId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await deviceService.connect(deviceId, {
        phone_number_id: phoneNumberId.trim(),
        waba_id: wabaId.trim(),
        access_token: accessToken.trim(),
      });
      onConnected();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect device");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4 rounded-md border bg-muted/30 p-4">
      <div className="space-y-1">
        <p className="text-sm font-medium">Connect Meta WhatsApp Cloud API</p>
        <p className="text-xs text-muted-foreground">
          Use credentials from Meta Developer Console: Phone Number ID, WABA ID, and a permanent access token.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`phone-number-id-${deviceId}`}>Phone Number ID</Label>
        <Input
          id={`phone-number-id-${deviceId}`}
          value={phoneNumberId}
          onChange={(e) => setPhoneNumberId(e.target.value)}
          placeholder="123456789012345"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`waba-id-${deviceId}`}>WABA ID</Label>
        <Input
          id={`waba-id-${deviceId}`}
          value={wabaId}
          onChange={(e) => setWabaId(e.target.value)}
          placeholder="987654321098765"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`access-token-${deviceId}`}>Access Token</Label>
        <Input
          id={`access-token-${deviceId}`}
          type="password"
          value={accessToken}
          onChange={(e) => setAccessToken(e.target.value)}
          placeholder="EAA..."
          required
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? "Connecting..." : "Connect"}
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={loading} onClick={onCancel}>
          Cancel
        </Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </form>
  );
}
