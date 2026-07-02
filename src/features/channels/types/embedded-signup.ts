export type EmbeddedSignupStep =
  | "about"
  | "requirements"
  | "launch"
  | "waiting"
  | "connected"
  | "sync"
  | "payment"
  | "success";

export type EmbeddedSignupProgressState =
  | "initializing"
  | "waiting_user_action"
  | "verifying_assets"
  | "syncing"
  | "completed";

export type RequirementId =
  | "business_manager"
  | "whatsapp_number"
  | "admin_permission"
  | "billing_setup";

export type EmbeddedSignupRequirement = {
  id: RequirementId;
  label: string;
  description: string;
  ready: boolean;
};

export type EmbeddedSignupResult = {
  channel_id: string;
  phone_number: string;
  waba_id: string;
  business_id?: string;
  phone_number_id?: string;
  waba_name?: string;
  business_name?: string;
};

export const EMBEDDED_SIGNUP_REQUIREMENTS: Omit<EmbeddedSignupRequirement, "ready">[] = [
  {
    id: "business_manager",
    label: "Meta Business Manager",
    description: "You have access to a Meta Business Manager account for this business.",
  },
  {
    id: "whatsapp_number",
    label: "WhatsApp Business Number",
    description: "Your phone number is registered on WhatsApp Business App.",
  },
  {
    id: "admin_permission",
    label: "Admin Permission",
    description: "You can grant Omni-Chan access to manage WhatsApp assets.",
  },
  {
    id: "billing_setup",
    label: "Billing Setup",
    description: "Meta billing is configured for WhatsApp Cloud API usage.",
  },
];

export const PROGRESS_STATE_LABELS: Record<EmbeddedSignupProgressState, string> = {
  initializing: "Initializing embedded signup session...",
  waiting_user_action: "Complete the steps in the Meta window",
  verifying_assets: "Verifying business assets",
  syncing: "Syncing channel configuration",
  completed: "Connection complete",
};
