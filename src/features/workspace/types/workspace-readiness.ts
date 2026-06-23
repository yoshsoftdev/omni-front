export type ReadinessCheckId =
  | "channel_connected"
  | "template_synced"
  | "contacts_available"
  | "team_members_added"
  | "campaign_created";

export type WorkspaceReadinessStatus = "not_started" | "in_progress" | "ready";

export type ReadinessCheck = {
  id: ReadinessCheckId;
  label: string;
  description: string;
  completed: boolean;
};

export type QuickActionId =
  | "connect_whatsapp"
  | "sync_templates"
  | "import_contacts"
  | "invite_team"
  | "create_campaign";

export type QuickAction = {
  id: QuickActionId;
  label: string;
  description: string;
  href: string;
};

export type WorkspaceReadiness = {
  score: number;
  completedCount: number;
  totalCount: number;
  status: WorkspaceReadinessStatus;
  checks: ReadinessCheck[];
  quickActions: QuickAction[];
};

export const READINESS_CHECK_ORDER: ReadinessCheckId[] = [
  "channel_connected",
  "template_synced",
  "contacts_available",
  "team_members_added",
  "campaign_created",
];

export const TOTAL_READINESS_CHECKS = READINESS_CHECK_ORDER.length;
