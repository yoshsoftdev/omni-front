"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { templateService } from "@/features/broadcast/services/broadcast.service";
import { deviceService } from "@/features/devices/services/device.service";
import type { WhatsAppTemplate } from "@/types/broadcast";
import type { Device } from "@/types/device";

export function SyncTemplatesPanel() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceId, setDeviceId] = useState("");
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadTemplates(selectedDeviceId: string) {
    if (!selectedDeviceId) {
      setTemplates([]);
      return;
    }
    const items = await templateService.list({ device_id: selectedDeviceId });
    setTemplates(items);
  }

  useEffect(() => {
    deviceService.list().then((list) => {
      const connected = list.filter((d) => d.status === "connected");
      setDevices(connected);
      if (connected.length > 0) {
        setDeviceId(connected[0].id);
        loadTemplates(connected[0].id);
      }
    });
  }, []);

  async function handleSync() {
    if (!deviceId) return;
    setLoading(true);
    setError(null);
    try {
      await templateService.sync(deviceId);
      await loadTemplates(deviceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync templates");
    } finally {
      setLoading(false);
    }
  }

  if (devices.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-sm font-medium">Meta templates</h2>
          <p className="text-xs text-muted-foreground">
            Templates are synced from Meta Business Manager. Create templates there, then sync here.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-2">
            <Label htmlFor="template-device">WABA device</Label>
            <select
              id="template-device"
              className="flex h-10 min-w-48 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={deviceId}
              onChange={(e) => {
                setDeviceId(e.target.value);
                loadTemplates(e.target.value);
              }}
            >
              {devices.map((device) => (
                <option key={device.id} value={device.id}>
                  {device.name}
                </option>
              ))}
            </select>
          </div>
          <Button type="button" variant="outline" onClick={handleSync} disabled={loading}>
            {loading ? "Syncing..." : "Sync templates"}
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {templates.length === 0 ? (
        <p className="text-sm text-muted-foreground">No templates synced for this device yet.</p>
      ) : (
        <div className="overflow-hidden rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Name</th>
                <th className="px-3 py-2 text-left font-medium">Language</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
                <th className="px-3 py-2 text-left font-medium">Category</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((template) => (
                <tr key={template.id} className="border-t">
                  <td className="px-3 py-2 font-medium">{template.name}</td>
                  <td className="px-3 py-2">{template.language}</td>
                  <td className="px-3 py-2">{template.status ?? "—"}</td>
                  <td className="px-3 py-2">{template.category ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
