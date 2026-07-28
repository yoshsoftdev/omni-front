export type ApiKeyStatus = "active" | "disabled";

export type ApiKeyScope = "send_template" | "send_text" | "contacts.read" | "endpoints.invoke";

export interface AutomationApiKey {
  id: string;
  name: string;
  /** Visible prefix for masked display, e.g. oc_auto_k9f2 */
  keyPrefix: string;
  scopes: ApiKeyScope[];
  status: ApiKeyStatus;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface CreateApiKeyInput {
  name: string;
  scopes: ApiKeyScope[];
}

/** Returned only on create / rotate — secret shown once. */
export interface ApiKeySecretResult {
  key: AutomationApiKey;
  secret: string;
}
