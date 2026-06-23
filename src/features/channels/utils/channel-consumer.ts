/**
 * Validates that Channel domain satisfies downstream feature needs.
 * Compile-time and adapter checks only — not wired to pages yet.
 */
import type { Template } from "@/features/broadcast/types/template";
import type { Channel } from "@/features/channels/types/channel";

export function isChannelConnected(channel: Channel): boolean {
  return channel.status === "connected";
}

/** Templates: sync + create require a connected channel id */
export function adaptChannelForTemplateSync(channel: Channel): { device_id: string } {
  return { device_id: channel.id };
}

export function adaptChannelForTemplateCreate(channel: Channel): {
  deviceId: string;
  wabaId?: string;
  label: string;
  phoneNumber?: string;
} {
  return {
    deviceId: channel.id,
    wabaId: channel.waba_id,
    label: channel.label,
    phoneNumber: channel.phone_number,
  };
}

/** Campaigns: sending identity on campaign record */
export function adaptChannelForCampaign(channel: Channel): {
  device_id: string;
  device_name: string;
  device_phone?: string;
  waba_id?: string;
} {
  return {
    device_id: channel.id,
    device_name: channel.label,
    device_phone: channel.phone_number,
    waba_id: channel.waba_id,
  };
}

/** Inbox: outbound send routing */
export function adaptChannelForInboxSend(channel: Channel): {
  device_id: string;
  phone_number?: string;
} {
  return {
    device_id: channel.id,
    phone_number: channel.phone_number,
  };
}

export type ChannelConsumerValidation = {
  templateSync: ReturnType<typeof adaptChannelForTemplateSync>;
  templateCreate: ReturnType<typeof adaptChannelForTemplateCreate>;
  campaign: ReturnType<typeof adaptChannelForCampaign>;
  inbox: ReturnType<typeof adaptChannelForInboxSend>;
};

export function filterTemplatesForChannel(templates: Template[], channelId: string): Template[] {
  if (!channelId) {
    return [];
  }
  return templates.filter((template) => template.device_id === channelId);
}

export function validateChannelConsumers(channel: Channel): ChannelConsumerValidation {
  if (!channel.id.trim()) {
    throw new Error("Channel consumer validation: id is required");
  }
  return {
    templateSync: adaptChannelForTemplateSync(channel),
    templateCreate: adaptChannelForTemplateCreate(channel),
    campaign: adaptChannelForCampaign(channel),
    inbox: adaptChannelForInboxSend(channel),
  };
}

// Compile-time assertion: connected channel exposes all consumer fields
const _connectedChannelFixture: Channel = {
  id: "ch_1",
  workspace_id: "ws_1",
  label: "Skinsure Glow Official",
  provider: "meta",
  status: "connected",
  connection_type: "embedded_coex",
  waba_id: "waba_1",
  phone_number_id: "pn_1",
  phone_number: "+62 812-3456-7890",
  is_coex: true,
};

const _validation: ChannelConsumerValidation = validateChannelConsumers(_connectedChannelFixture);

void _validation;
