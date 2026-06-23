import type { Campaign } from "@/features/broadcast/types/campaign";
import type { Template } from "@/features/broadcast/types/template";
import type { Channel } from "@/features/channels/types/channel";
import type { Segment } from "@/features/segments/types/segment";
import type { TeamMember } from "@/types/team";
import type { WorkspaceReadiness } from "@/features/workspace/types/workspace-readiness";

export type OnboardingStep = 1 | 2 | 3 | 4 | 5 | 6;

export type OnboardingStepId =
  | "connect_whatsapp"
  | "sync_templates"
  | "import_contacts"
  | "invite_team"
  | "create_campaign"
  | "complete_setup";

export type OnboardingStepDefinition = {
  step: OnboardingStep;
  id: OnboardingStepId;
  label: string;
  description: string;
  estimatedMinutes: number;
};

export const ONBOARDING_STEPS: OnboardingStepDefinition[] = [
  {
    step: 1,
    id: "connect_whatsapp",
    label: "Connect WhatsApp",
    description: "Link your WhatsApp Business channel to start sending messages.",
    estimatedMinutes: 5,
  },
  {
    step: 2,
    id: "sync_templates",
    label: "Sync Templates",
    description: "Pull approved templates from Meta into your workspace.",
    estimatedMinutes: 3,
  },
  {
    step: 3,
    id: "import_contacts",
    label: "Import Contacts",
    description: "Build your audience before launching campaigns.",
    estimatedMinutes: 4,
  },
  {
    step: 4,
    id: "invite_team",
    label: "Invite Team Members",
    description: "Add teammates to manage inbox, contacts, and broadcasts.",
    estimatedMinutes: 3,
  },
  {
    step: 5,
    id: "create_campaign",
    label: "Create First Campaign",
    description: "Set up your first template-based WhatsApp broadcast.",
    estimatedMinutes: 6,
  },
  {
    step: 6,
    id: "complete_setup",
    label: "Complete Setup",
    description: "Review readiness and launch your workspace.",
    estimatedMinutes: 1,
  },
];

export type RecentImport = {
  id: string;
  name: string;
  count: number;
  imported_at: string;
  source: "csv" | "excel" | "manual";
};

export type OnboardingStepSnapshot = {
  connectedChannels: Channel[];
  allChannels: Channel[];
  templates: Template[];
  templateCount: number;
  lastTemplateSync: string | null;
  segments: Segment[];
  totalContacts: number;
  importedContacts: number;
  recentImports: RecentImport[];
  members: TeamMember[];
  pendingInvites: TeamMember[];
  campaigns: Campaign[];
  readiness: WorkspaceReadiness;
};

export const SETUP_STEP_IDS: OnboardingStepId[] = [
  "connect_whatsapp",
  "sync_templates",
  "import_contacts",
  "invite_team",
  "create_campaign",
];
