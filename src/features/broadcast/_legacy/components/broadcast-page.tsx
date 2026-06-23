"use client";

import { useCallback, useEffect, useState } from "react";

import { BroadcastsTable } from "@/features/broadcast/_legacy/components/broadcasts-table";
import { CreateBroadcastForm } from "@/features/broadcast/_legacy/components/create-broadcast-form";
import { SyncTemplatesPanel } from "@/features/broadcast/_legacy/components/sync-templates-panel";
import { campaignService } from "@/features/broadcast/services/broadcast.service";
import { useAuthStore } from "@/store/auth-store";
import type { Campaign } from "@/features/broadcast/types/campaign";

export function BroadcastPage() {
  const role = useAuthStore((state) => state.role);
  const canManage = role === "owner" || role === "admin";
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCampaigns = useCallback(async () => {
    setError(null);
    try {
      const data = await campaignService.list();
      setCampaigns(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCampaigns();
    const interval = setInterval(loadCampaigns, 10000);
    return () => clearInterval(interval);
  }, [loadCampaigns]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Broadcast</h1>
        <p className="text-muted-foreground">
          Send approved Meta WhatsApp templates to your audience. Free-text broadcast is not supported.
        </p>
      </div>

      {canManage ? <SyncTemplatesPanel /> : null}
      {canManage ? <CreateBroadcastForm onCreated={loadCampaigns} /> : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading campaigns...</p>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <BroadcastsTable campaigns={campaigns} onChanged={loadCampaigns} />
      )}
    </div>
  );
}
