import { apiClient } from "@/services/api/client";

export type ChannelPermissions = {
  contacts: boolean;
  templates: boolean;
  conversation_sync: boolean;
  last_checked_at?: string;
};

export type ChannelSyncResourceStatus = {
  status: "not_synced" | "in_progress" | "completed" | "failed";
  created?: number;
  updated?: number;
  synced?: number;
  imported?: number;
};

export type ChannelSyncStatus = {
  permissions: "granted" | "missing" | "expired";
  contacts: ChannelSyncResourceStatus;
  templates: ChannelSyncResourceStatus;
  conversations: ChannelSyncResourceStatus;
  last_sync_at?: string;
};

export type ContactSyncResult = {
  created: number;
  updated: number;
  duplicates: number;
};

export type ConversationSyncResult = {
  imported: number;
  reason?: string;
};

export type ReauthorizeResult = {
  session_id: string;
  oauth_state: string;
  status: string;
  expires_at: string;
};

export const channelSyncService = {
  async getStatus(channelId: string): Promise<ChannelSyncStatus> {
    const response = await apiClient.get<ChannelSyncStatus>(`/channels/${channelId}/sync/status`);
    return response.data!;
  },

  async getPermissions(channelId: string): Promise<ChannelPermissions> {
    const response = await apiClient.get<ChannelPermissions>(`/channels/${channelId}/permissions`);
    return response.data!;
  },

  async syncContacts(channelId: string): Promise<ContactSyncResult> {
    const response = await apiClient.post<ContactSyncResult>(`/channels/${channelId}/sync/contacts`);
    return response.data!;
  },

  async syncConversations(channelId: string): Promise<ConversationSyncResult> {
    const response = await apiClient.post<ConversationSyncResult>(`/channels/${channelId}/sync/conversations`);
    return response.data!;
  },

  async reauthorize(channelId: string): Promise<ReauthorizeResult> {
    const response = await apiClient.post<ReauthorizeResult>(`/channels/${channelId}/permissions/reauthorize`);
    return response.data!;
  },
};
