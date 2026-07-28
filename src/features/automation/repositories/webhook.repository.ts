import { webhookRepositoryApi } from "@/features/automation/repositories/webhook.repository.api";
import type {
  CreateForwardWebhookInput,
  ForwardDelivery,
  ForwardWebhook,
  UpdateForwardWebhookInput,
} from "@/features/automation/types/webhook";

export interface ForwardWebhookRepository {
  list(): Promise<ForwardWebhook[]>;
  create(input: CreateForwardWebhookInput): Promise<ForwardWebhook>;
  update(id: string, patch: UpdateForwardWebhookInput): Promise<ForwardWebhook>;
  enable(id: string): Promise<ForwardWebhook>;
  disable(id: string): Promise<ForwardWebhook>;
  remove(id: string): Promise<void>;
  listDeliveries(id: string, page?: number, pageSize?: number): Promise<ForwardDelivery[]>;
}

export function getWebhookRepository(): ForwardWebhookRepository {
  return webhookRepositoryApi;
}
