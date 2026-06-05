"use client";

import { useCallback, useEffect, useState } from "react";

import { BroadcastsTable } from "@/features/broadcast/components/broadcasts-table";
import { CreateBroadcastForm } from "@/features/broadcast/components/create-broadcast-form";
import { broadcastService } from "@/features/broadcast/services/broadcast.service";
import { useAuthStore } from "@/store/auth-store";
import type { Broadcast } from "@/types/broadcast";

export function BroadcastPage() {
  const role = useAuthStore((state) => state.role);
  const canManage = role === "owner" || role === "admin";
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBroadcasts = useCallback(async () => {
    setError(null);
    try {
      const data = await broadcastService.list();
      setBroadcasts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load broadcasts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBroadcasts();
  }, [loadBroadcasts]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Broadcast</h1>
        <p className="text-muted-foreground">Create WhatsApp broadcast campaigns with scheduling.</p>
      </div>

      {canManage ? <CreateBroadcastForm onCreated={loadBroadcasts} /> : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading campaigns...</p>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <BroadcastsTable broadcasts={broadcasts} onChanged={loadBroadcasts} />
      )}
    </div>
  );
}
