import type { ActionTypeMeta } from "@/features/automation/types/action";

export const ACTION_TYPE_REGISTRY: ActionTypeMeta[] = [
  {
    type: "send_template",
    label: "Send Template",
    description: "Send an approved WhatsApp template message to a recipient.",
    available: true,
  },
  {
    type: "send_text",
    label: "Send Text",
    description: "Send a free-form text message within an open session window.",
    available: true,
  },
  {
    type: "add_tag",
    label: "Add Tag",
    description: "Attach a tag to a contact from an external system.",
    available: false,
    badge: "Coming soon",
  },
  {
    type: "assign_conversation",
    label: "Assign Conversation",
    description: "Route an open conversation to a team member or queue.",
    available: false,
    badge: "Coming soon",
  },
  {
    type: "ai_agent",
    label: "AI Agent",
    description: "Invoke an AI agent with a prompt and model configuration.",
    available: false,
    badge: "Coming soon",
  },
  {
    type: "custom_workflow",
    label: "Custom Workflow",
    description: "Trigger a reusable workflow defined in Omni Chan.",
    available: false,
    badge: "Future",
  },
];

export function getActionMeta(type: string): ActionTypeMeta | undefined {
  return ACTION_TYPE_REGISTRY.find((item) => item.type === type);
}

export function actionTypeLabel(type: string): string {
  return getActionMeta(type)?.label ?? type;
}
