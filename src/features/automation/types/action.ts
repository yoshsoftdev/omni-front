/** Extensible action discriminator for Automation endpoints. */
export type ActionType =
  | "send_template"
  | "send_text"
  | "add_tag"
  | "assign_conversation"
  | "ai_agent"
  | "custom_workflow";

export type RecipientMode = "phone" | "contact_id" | "conversation_id";

export interface VariableMapping {
  /** Internal template variable key, e.g. "1" or "customer_name". */
  templateVariable: string;
  /** Exposed JSON body parameter name. */
  apiParameter: string;
  required: boolean;
  defaultValue?: string;
  description?: string;
}

/** actionConfig for actionType = send_template */
export interface SendTemplateActionConfig {
  templateId: string;
  templateName: string;
  recipientMode: RecipientMode;
  variableMappings: VariableMapping[];
}

/** actionConfig for actionType = send_text */
export interface SendTextActionConfig {
  channelId: string;
  recipientMode: RecipientMode;
  textParameter: string;
  defaultText?: string;
}

export type ActionConfig =
  | SendTemplateActionConfig
  | SendTextActionConfig
  | Record<string, unknown>;

export interface ActionTypeMeta {
  type: ActionType;
  label: string;
  description: string;
  available: boolean;
  badge?: "Coming soon" | "Future";
}
