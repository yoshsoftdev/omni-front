"use client";

import type { ReactNode } from "react";
import { Copy, Pencil, X } from "lucide-react";

import { ColorDot } from "@/components/shared/color-dot";
import { RightDrawer, RightDrawerBody, RightDrawerHeader } from "@/components/shared/right-drawer";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/features/broadcast/components/campaigns/campaign-table";
import { formatSchedule } from "@/features/broadcast/utils/campaign-list-format";
import type { Campaign } from "@/features/broadcast/types/campaign";

interface ScheduleDrawerProps {
  campaign: Campaign | null;
  open: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onCancel?: () => void;
}

export function ScheduleDrawer({ campaign, open, onClose, onEdit, onDuplicate, onCancel }: ScheduleDrawerProps) {
  if (!campaign) return null;

  return (
    <RightDrawer
      open={open}
      onClose={onClose}
      footer={
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" className="gap-1.5" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" />
            Edit Schedule
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={onDuplicate}>
            <Copy className="h-3.5 w-3.5" />
            Duplicate
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 text-destructive hover:text-destructive" onClick={onCancel}>
            <X className="h-3.5 w-3.5" />
            Cancel Schedule
          </Button>
        </div>
      }
    >
      <RightDrawerHeader onClose={onClose}>
        <h2 className="text-lg font-semibold">Schedule Detail</h2>
      </RightDrawerHeader>
      <RightDrawerBody>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold">{campaign.name}</h3>
            <div className="mt-2">
              <StatusBadge status={campaign.status} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <InfoBlock label="Template" value={campaign.template_name} />
            <InfoBlock
              label="Audience"
              value={
                <span className="inline-flex items-center gap-1.5">
                  <ColorDot color="#10B981" className="h-2 w-2" />
                  {campaign.audience?.name || campaign.segment_name || "—"}
                </span>
              }
            />
            <InfoBlock label="Recipients" value={campaign.total_contacts.toLocaleString()} />
            <InfoBlock label="Status" value={campaign.status} />
            <InfoBlock label="Schedule Time" value={formatSchedule(campaign.scheduled_at)} />
            <InfoBlock label="Timezone" value={campaign.timezone} />
            <InfoBlock label="Created By" value={campaign.created_by} />
            <InfoBlock label="Created At" value={formatSchedule(campaign.created_at)} />
          </div>
        </div>
      </RightDrawerBody>
    </RightDrawer>
  );
}

function InfoBlock({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}
