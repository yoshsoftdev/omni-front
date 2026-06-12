"use client";

import { useCallback, useEffect, useState } from "react";

import { AddDeviceForm } from "@/features/devices/components/add-device-form";
import { DeviceCard } from "@/features/devices/components/device-card";
import { deviceService } from "@/features/devices/services/device.service";
import { useAuthStore } from "@/store/auth-store";
import type { Device } from "@/types/device";

export function DevicesPage() {
  const role = useAuthStore((state) => state.role);
  const canManage = role === "owner" || role === "admin";
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDevices = useCallback(async () => {
    setError(null);
    try {
      const data = await deviceService.list();
      setDevices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load devices");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Devices</h1>
        <p className="text-muted-foreground">
          Hubungkan nomor WhatsApp Business via Embedded Signup (Coexistence) atau koneksi manual.
        </p>
      </div>

      {canManage ? <AddDeviceForm onCreated={loadDevices} /> : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading devices...</p>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : devices.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No devices yet. Add a WhatsApp device to get started.
        </div>
      ) : (
        <div className="grid gap-4">
          {devices.map((device) => (
            <DeviceCard key={device.id} device={device} onChanged={loadDevices} />
          ))}
        </div>
      )}
    </div>
  );
}
