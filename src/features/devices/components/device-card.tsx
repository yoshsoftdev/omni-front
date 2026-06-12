"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ConnectMetaForm } from "@/features/devices/components/connect-meta-form";
import { EmbeddedCoexConnect } from "@/features/devices/components/embedded-coex-connect";
import { DeviceStatusBadge } from "@/features/devices/components/device-status-badge";
import { deviceService } from "@/features/devices/services/device.service";
import { useAuthStore } from "@/store/auth-store";
import type { Device } from "@/types/device";

interface DeviceCardProps {
  device: Device;
  onChanged: () => void;
}

type ConnectMode = "none" | "manual" | "coex";

export function DeviceCard({ device, onChanged }: DeviceCardProps) {
  const role = useAuthStore((state) => state.role);
  const canManage = role === "owner" || role === "admin";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectMode, setConnectMode] = useState<ConnectMode>("none");

  async function runAction(action: () => Promise<void>) {
    setError(null);
    setLoading(true);
    try {
      await action();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete device "${device.name}"?`)) return;
    await runAction(async () => {
      await deviceService.remove(device.id);
    });
  }

  const onboardingPending =
    device.is_coex &&
    device.onboarding?.status &&
    device.onboarding.status !== "completed" &&
    device.onboarding.status !== "failed";

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{device.name}</h3>
            <DeviceStatusBadge status={device.status} />
            {device.is_coex ? (
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-blue-700">
                Coex
              </span>
            ) : null}
          </div>
          {device.phone_number ? (
            <p className="text-sm text-muted-foreground">{device.phone_number}</p>
          ) : (
            <p className="text-sm text-muted-foreground">No number linked</p>
          )}
          {device.provider ? (
            <p className="text-xs text-muted-foreground">Provider: {device.provider}</p>
          ) : null}
          {device.onboarding?.status ? (
            <p className="text-xs text-muted-foreground">
              Onboarding: {device.onboarding.status}
              {device.onboarding.contacts_synced_count > 0
                ? ` · ${device.onboarding.contacts_synced_count} kontak`
                : ""}
              {device.onboarding.history_messages_synced > 0
                ? ` · ${device.onboarding.history_messages_synced} pesan`
                : ""}
            </p>
          ) : null}
        </div>

        {canManage ? (
          <div className="flex flex-wrap gap-2">
            {device.status === "disconnected" && connectMode === "none" ? (
              <>
                <Button size="sm" disabled={loading} onClick={() => setConnectMode("coex")}>
                  Connect Coex
                </Button>
                <Button size="sm" variant="outline" disabled={loading} onClick={() => setConnectMode("manual")}>
                  Manual Connect
                </Button>
              </>
            ) : null}
            {onboardingPending ? (
              <Button size="sm" variant="outline" asChild>
                <Link href={`/devices/onboarding/${device.id}`}>Lanjut Onboarding</Link>
              </Button>
            ) : null}
            {device.status !== "disconnected" ? (
              <Button
                size="sm"
                variant="outline"
                disabled={loading}
                onClick={() => runAction(async () => { await deviceService.disconnect(device.id); })}
              >
                Disconnect
              </Button>
            ) : null}
            <Button size="sm" variant="ghost" disabled={loading} onClick={handleDelete}>
              Delete
            </Button>
          </div>
        ) : null}
      </div>

      {connectMode === "manual" && device.status === "disconnected" ? (
        <ConnectMetaForm
          deviceId={device.id}
          onConnected={() => {
            setConnectMode("none");
            onChanged();
          }}
          onCancel={() => setConnectMode("none")}
        />
      ) : null}

      {connectMode === "coex" && device.status === "disconnected" ? (
        <EmbeddedCoexConnect
          deviceId={device.id}
          onConnected={() => {
            setConnectMode("none");
            onChanged();
            window.location.href = `/devices/onboarding/${device.id}`;
          }}
          onCancel={() => setConnectMode("none")}
        />
      ) : null}

      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
