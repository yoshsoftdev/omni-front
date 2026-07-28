import type { VariableMapping } from "@/features/automation/types/action";
import { toApiParameterName } from "@/features/automation/utils/slug";
import type { Template } from "@/features/broadcast/types/template";

const VARIABLE_LABELS: Record<string, { api: string; description: string }> = {
  "1": { api: "customerName", description: "Customer full name" },
  "2": { api: "value2", description: "Second template variable" },
  "3": { api: "value3", description: "Third template variable" },
};

/**
 * Build default variable mappings from a WhatsApp template body ({{1}}, {{2}}, …).
 */
export function buildDefaultVariableMappings(template: Template): VariableMapping[] {
  const count = Math.max(template.variable_count, 0);
  const mappings: VariableMapping[] = [];
  for (let i = 1; i <= count; i += 1) {
    const key = String(i);
    const preset = VARIABLE_LABELS[key];
    mappings.push({
      templateVariable: key,
      apiParameter: preset?.api ?? toApiParameterName(key),
      required: true,
      description: preset?.description ?? `Template variable {{${key}}}`,
    });
  }
  return mappings;
}

/** Build example request body from mappings + recipient. */
export function buildExampleRequestBody(
  mappings: VariableMapping[],
  recipientMode: string = "phone",
): Record<string, string> {
  const body: Record<string, string> = {};
  if (recipientMode === "phone") {
    body.to = "+6281234567890";
  } else if (recipientMode === "contact_id") {
    body.contactId = "ct_01EXAMPLE";
  } else {
    body.conversationId = "cv_01EXAMPLE";
  }
  for (const mapping of mappings) {
    body[mapping.apiParameter] = mapping.defaultValue?.trim()
      ? mapping.defaultValue
      : `<${mapping.apiParameter}>`;
  }
  return body;
}

export function isSendTemplateConfig(
  config: unknown,
): config is {
  templateId: string;
  templateName: string;
  recipientMode: string;
  variableMappings: VariableMapping[];
} {
  if (!config || typeof config !== "object") return false;
  const c = config as Record<string, unknown>;
  return typeof c.templateId === "string" && Array.isArray(c.variableMappings);
}

export function isSendTextConfig(
  config: unknown,
): config is {
  channelId: string;
  recipientMode: string;
  textParameter: string;
  defaultText?: string;
} {
  if (!config || typeof config !== "object") return false;
  const c = config as Record<string, unknown>;
  return typeof c.channelId === "string" && typeof c.textParameter === "string";
}
