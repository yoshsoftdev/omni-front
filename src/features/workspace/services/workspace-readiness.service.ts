import { campaignQueryService } from "@/features/broadcast/services/campaign-query.service";
import { templateQueryService } from "@/features/broadcast/services/template-query.service";
import { channelQueryService } from "@/features/channels/services/channel-query.service";
import { segmentService } from "@/features/segments/services/segment.service";
import { teamService } from "@/features/team/services/team.service";
import type {
  QuickAction,
  ReadinessCheck,
  ReadinessCheckId,
  WorkspaceReadiness,
  WorkspaceReadinessStatus,
} from "@/features/workspace/types/workspace-readiness";
import { TOTAL_READINESS_CHECKS } from "@/features/workspace/types/workspace-readiness";

const CHECK_DEFINITIONS: Record<
  ReadinessCheckId,
  Omit<ReadinessCheck, "completed">
> = {
  channel_connected: {
    id: "channel_connected",
    label: "Channel Connected",
    description: "At least one WhatsApp channel is connected and ready to send.",
  },
  template_synced: {
    id: "template_synced",
    label: "Template Synced",
    description: "Approved WhatsApp templates are available in your workspace.",
  },
  contacts_available: {
    id: "contacts_available",
    label: "Contacts Available",
    description: "Your audience has contacts available for campaigns.",
  },
  team_members_added: {
    id: "team_members_added",
    label: "Team Members Added",
    description: "Invite teammates to collaborate on inbox and broadcasts.",
  },
  campaign_created: {
    id: "campaign_created",
    label: "Campaign Created",
    description: "Create your first broadcast campaign.",
  },
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "connect_whatsapp",
    label: "Connect WhatsApp",
    description: "Link a WhatsApp Business channel via Meta.",
    href: "/devices/embedded-signup?returnTo=/dashboard",
  },
  {
    id: "sync_templates",
    label: "Sync Templates",
    description: "Pull approved templates from Meta.",
    href: "/broadcast/templates",
  },
  {
    id: "import_contacts",
    label: "Import Contacts",
    description: "Upload or sync your contact audience.",
    href: "/contacts/import",
  },
  {
    id: "invite_team",
    label: "Invite Team Member",
    description: "Add agents or supervisors to your workspace.",
    href: "/team/users",
  },
  {
    id: "create_campaign",
    label: "Create Campaign",
    description: "Launch your first template-based broadcast.",
    href: "/broadcast/campaigns/create",
  },
];

/** Maps completed check count to 0%, 25%, 50%, 75%, or 100%. */
export function calculateReadinessScore(completedCount: number, total = TOTAL_READINESS_CHECKS): number {
  if (completedCount <= 0) return 0;
  if (completedCount >= total) return 100;
  return Math.ceil((completedCount / total) * 4) * 25;
}

function resolveStatus(score: number): WorkspaceReadinessStatus {
  if (score === 0) return "not_started";
  if (score === 100) return "ready";
  return "in_progress";
}

async function evaluateTeamMembersAdded(): Promise<boolean> {
  try {
    const members = await teamService.listMembers();
    return members.length > 1;
  } catch {
    return false;
  }
}

export async function getWorkspaceReadiness(): Promise<WorkspaceReadiness> {
  const [connectedChannels, templates, segments, campaigns, teamMembersAdded] = await Promise.all([
    channelQueryService.getConnectedChannels(),
    templateQueryService.getTemplates(),
    segmentService.list(),
    campaignQueryService.getCampaigns(),
    evaluateTeamMembersAdded(),
  ]);

  const totalContacts = segments.reduce((sum, segment) => sum + segment.contact_count, 0);

  const completionById: Record<ReadinessCheckId, boolean> = {
    channel_connected: connectedChannels.length > 0,
    template_synced: templates.length > 0,
    contacts_available: totalContacts > 0,
    team_members_added: teamMembersAdded,
    campaign_created: campaigns.length > 0,
  };

  const checks: ReadinessCheck[] = Object.values(CHECK_DEFINITIONS).map((definition) => ({
    ...definition,
    completed: completionById[definition.id],
  }));

  const completedCount = checks.filter((check) => check.completed).length;
  const score = calculateReadinessScore(completedCount);

  return {
    score,
    completedCount,
    totalCount: TOTAL_READINESS_CHECKS,
    status: resolveStatus(score),
    checks,
    quickActions: QUICK_ACTIONS,
  };
}
