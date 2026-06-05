"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ConnectMetaForm } from "@/features/devices/components/connect-meta-form";
import { DeviceStatusBadge } from "@/features/devices/components/device-status-badge";
import { deviceService } from "@/features/devices/services/device.service";
import { useAuthStore } from "@/store/auth-store";
import type { Device } from "@/types/device";

interface DeviceCardProps {
  device: Device;
  onChanged: () => void;
}

export function DeviceCard({ device, onChanged }: DeviceCardProps) {
  const role = useAuthStore((state) => state.role);
  const canManage = role === "owner" || role === "admin";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConnectForm, setShowConnectForm] = useState(false);

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

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{device.name}</h3>
            <DeviceStatusBadge status={device.status} />
          </div>
          {device.phone_number ? (
            <p className="text-sm text-muted-foreground">{device.phone_number}</p>
          ) : (
            <p className="text-sm text-muted-foreground">No number linked</p>
          )}
          {device.provider ? (
            <p className="text-xs text-muted-foreground">Provider: {device.provider}</p>
          ) : null}
        </div>

        {canManage ? (
          <div className="flex flex-wrap gap-2">
            {device.status === "disconnected" && !showConnectForm ? (
              <Button size="sm" disabled={loading} onClick={() => setShowConnectForm(true)}>
                Connect Meta
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

      {showConnectForm && device.status === "disconnected" ? (
        <ConnectMetaForm
          deviceId={device.id}
          onConnected={() => {
            setShowConnectForm(false);
            onChanged();
          }}
          onCancel={() => setShowConnectForm(false)}
        />
      ) : null}

      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
