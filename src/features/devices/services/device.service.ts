import { apiClient } from "@/services/api/client";
import type {
  ConnectDeviceInput,
  ConnectEmbeddedInput,
  Device,
  OnboardingStatusResponse,
} from "@/types/device";

export const deviceService = {
  async list() {
    const response = await apiClient.get<{ devices: Device[] }>("/devices");
    return response.data?.devices ?? [];
  },

  async create(name: string) {
    const response = await apiClient.post<Device>("/devices", { name });
    return response.data!;
  },

  async update(id: string, name: string) {
    const response = await apiClient.patch<Device>(`/devices/${id}`, { name });
    return response.data!;
  },

  async remove(id: string) {
    await apiClient.delete(`/devices/${id}`);
  },

  async connect(id: string, input: ConnectDeviceInput) {
    const response = await apiClient.post<Device>(`/devices/${id}/connect`, input);
    return response.data!;
  },

  async connectEmbedded(id: string, input: ConnectEmbeddedInput) {
    const response = await apiClient.post<Device>(`/devices/${id}/connect/embedded`, input);
    return response.data!;
  },

  async startOnboardingSync(id: string) {
    const response = await apiClient.post<OnboardingStatusResponse>(`/devices/${id}/onboarding/sync`, {});
    return response.data!;
  },

  async getOnboardingStatus(id: string) {
    const response = await apiClient.get<OnboardingStatusResponse>(`/devices/${id}/onboarding/status`);
    return response.data!;
  },

  async disconnect(id: string) {
    const response = await apiClient.post<Device>(`/devices/${id}/disconnect`);
    return response.data!;
  },
};
