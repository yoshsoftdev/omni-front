export interface QuickReplyVariableContext {
  customer_name?: string;
  agent_name?: string;
  company_name?: string;
  phone?: string;
  today?: string;
}

const VARIABLE_PATTERN = /\{\{(customer_name|agent_name|company_name|phone|today)\}\}/g;

export function resolveQuickReplyVariables(
  template: string,
  context: QuickReplyVariableContext,
): string {
  return template.replace(VARIABLE_PATTERN, (_match, key: keyof QuickReplyVariableContext) => {
    const value = context[key];
    return typeof value === "string" ? value : "";
  });
}

export function formatQuickReplyToday(date = new Date()): string {
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
