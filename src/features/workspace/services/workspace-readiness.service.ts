import { apiClient } from "@/services/api/client";
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
  meta_connected: {
    id: "meta_connected",
    label: "Meta Connected",
    description: "A WhatsApp channel is connected and Meta-ready.",
  },
  payment_method: {
    id: "payment_method",
    label: "Payment Method",
    description: "A Meta payment method is configured for marketing campaigns.",
  },
  templates_synced: {
    id: "templates_synced",
    label: "Templates Synced",
    description: "Approved WhatsApp templates are available in your workspace.",
  },
  existing_data_synced: {
    id: "existing_data_synced",
    label: "Existing Data Synced",
    description: "Contacts and templates have been synchronized from Meta.",
  },
  contacts_available: {
    id: "contacts_available",
    label: "Contacts Imported",
    description: "Your audience has contacts available for campaigns.",
  },
  team_members_added: {
    id: "team_members_added",
    label: "Team Added",
    description: "Invite teammates to collaborate on inbox and broadcasts.",
  },
  campaign_created: {
    id: "campaign_created",
    label: "First Campaign",
    description: "Create your first template-based broadcast.",
  },
};

const LEGACY_CHECK_ALIASES: Record<string, ReadinessCheckId> = {
  channel_connected: "meta_connected",
  template_synced: "templates_synced",
  templates_recently_synced: "templates_synced",
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "connect_whatsapp",
    label: "Connect WhatsApp",
    description: "Link a WhatsApp Business channel via Meta.",
    href: "/devices/embedded-signup?returnTo=/dashboard",
  },
  {
    id: "add_payment",
    label: "Add Payment",
    description: "Configure Meta billing before sending campaigns.",
    href: "/devices",
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

type ApiReadinessResponse = {
  score: number;
  status: WorkspaceReadinessStatus;
  checks: Array<{ key: string; completed: boolean }>;
};

function normalizeCheckKey(key: string): ReadinessCheckId | null {
  if (key in CHECK_DEFINITIONS) {
    return key as ReadinessCheckId;
  }
  return LEGACY_CHECK_ALIASES[key] ?? null;
}

function mapApiReadiness(data: ApiReadinessResponse): WorkspaceReadiness {
  const completionById = {} as Record<ReadinessCheckId, boolean>;
  for (const check of data.checks) {
    const id = normalizeCheckKey(check.key);
    if (!id) continue;
    completionById[id] = completionById[id] || check.completed;
  }

  const checks: ReadinessCheck[] = Object.values(CHECK_DEFINITIONS).map((definition) => ({
    ...definition,
    completed: completionById[definition.id] ?? false,
  }));

  const completedCount = checks.filter((check) => check.completed).length;

  return {
    score: data.score,
    completedCount,
    totalCount: TOTAL_READINESS_CHECKS,
    status: data.status,
    checks,
    quickActions: QUICK_ACTIONS,
  };
}

export async function getWorkspaceReadiness(): Promise<WorkspaceReadiness> {
  const response = await apiClient.get<ApiReadinessResponse>("/workspace/readiness");
  return mapApiReadiness(response.data!);
}

export async function refreshWorkspaceReadiness(): Promise<WorkspaceReadiness> {
  const response = await apiClient.post<ApiReadinessResponse>("/workspace/readiness/refresh");
  return mapApiReadiness(response.data!);
}

/** Maps completed check count to 0%, 25%, 50%, 75%, or 100%. */
export function calculateReadinessScore(completedCount: number, total = TOTAL_READINESS_CHECKS): number {
  if (completedCount <= 0) return 0;
  if (completedCount >= total) return 100;
  return Math.ceil((completedCount / total) * 4) * 25;
}
