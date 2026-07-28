import { apiClient } from "@/services/api/client";
import type { ForwardWebhookRepository } from "@/features/automation/repositories/webhook.repository";
import type {
  CreateForwardWebhookInput,
  ForwardDelivery,
  ForwardWebhook,
  UpdateForwardWebhookInput,
} from "@/features/automation/types/webhook";

type PagePayload<T> = {
  items: T[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
};

class ApiForwardWebhookRepository implements ForwardWebhookRepository {
  async list(): Promise<ForwardWebhook[]> {
    const res = await apiClient.get<ForwardWebhook[]>("/automation/webhooks");
    return (res.data as ForwardWebhook[]) ?? [];
  }

  async create(input: CreateForwardWebhookInput): Promise<ForwardWebhook> {
    const res = await apiClient.post<ForwardWebhook>("/automation/webhooks", input);
    return res.data as ForwardWebhook;
  }

  async update(id: string, patch: UpdateForwardWebhookInput): Promise<ForwardWebhook> {
    const res = await apiClient.patch<ForwardWebhook>(`/automation/webhooks/${id}`, patch);
    return res.data as ForwardWebhook;
  }

  async enable(id: string): Promise<ForwardWebhook> {
    const res = await apiClient.post<ForwardWebhook>(`/automation/webhooks/${id}/enable`);
    return res.data as ForwardWebhook;
  }

  async disable(id: string): Promise<ForwardWebhook> {
    const res = await apiClient.post<ForwardWebhook>(`/automation/webhooks/${id}/disable`);
    return res.data as ForwardWebhook;
  }

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/automation/webhooks/${id}`);
  }

  async listDeliveries(id: string, page = 1, pageSize = 20): Promise<ForwardDelivery[]> {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
    });
    const res = await apiClient.get<PagePayload<ForwardDelivery>>(
      `/automation/webhooks/${id}/deliveries?${params.toString()}`,
    );
    const payload = res.data as PagePayload<ForwardDelivery>;
    return payload.items ?? [];
  }
}

export const webhookRepositoryApi = new ApiForwardWebhookRepository();
