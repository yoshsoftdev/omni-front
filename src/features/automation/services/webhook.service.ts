import { getWebhookRepository } from "@/features/automation/repositories/webhook.repository";
import type {
  CreateForwardWebhookInput,
  UpdateForwardWebhookInput,
} from "@/features/automation/types/webhook";

const repository = getWebhookRepository();

export const webhookService = {
  list: () => repository.list(),
  create: (input: CreateForwardWebhookInput) => repository.create(input),
  update: (id: string, patch: UpdateForwardWebhookInput) => repository.update(id, patch),
  enable: (id: string) => repository.enable(id),
  disable: (id: string) => repository.disable(id),
  remove: (id: string) => repository.remove(id),
  listDeliveries: (id: string) => repository.listDeliveries(id),
};
