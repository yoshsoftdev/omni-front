import { create } from "zustand";

import type { Channel } from "@/features/channels/types/channel";

export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** Campaign draft persisted across wizard steps. */
export type CampaignWizardDraft = {
  campaignName: string;
  description: string;
  channelId: string;
  deviceId: string;
  channelName: string;
  phoneNumber: string;
  templateId: string;
  variableMapping: Record<string, string>;
  sampleValues: Record<string, string>;
  headerMediaUrl: string;
  headerVariableMapping: Record<string, string>;
  includeHeader: boolean;
  includeFooter: boolean;
  selectedTagIds: string[];
  sendMode: "now" | "later";
  scheduleDate: string;
  scheduleTime: string;
  timezone: string;
};

interface CampaignWizardState extends CampaignWizardDraft {
  step: WizardStep;
  setStep: (step: WizardStep) => void;
  setCampaignName: (value: string) => void;
  setDescription: (value: string) => void;
  setChannel: (channel: Channel) => void;
  setTemplateId: (value: string) => void;
  setVariableMapping: (value: Record<string, string>) => void;
  setSampleValues: (value: Record<string, string>) => void;
  setHeaderMediaUrl: (value: string) => void;
  setHeaderVariableMapping: (value: Record<string, string>) => void;
  setIncludeHeader: (value: boolean) => void;
  setIncludeFooter: (value: boolean) => void;
  setSelectedTagIds: (value: string[]) => void;
  setSendMode: (value: "now" | "later") => void;
  setScheduleDate: (value: string) => void;
  setScheduleTime: (value: string) => void;
  setTimezone: (value: string) => void;
  reset: () => void;
}

const initialState: CampaignWizardDraft & { step: WizardStep } = {
  step: 1,
  campaignName: "",
  description: "",
  channelId: "",
  deviceId: "",
  channelName: "",
  phoneNumber: "",
  templateId: "",
  variableMapping: {},
  sampleValues: {},
  headerMediaUrl: "",
  headerVariableMapping: {},
  includeHeader: true,
  includeFooter: true,
  selectedTagIds: [],
  sendMode: "now",
  scheduleDate: "",
  scheduleTime: "",
  timezone: "Asia/Jakarta",
};

export const useCampaignWizardStore = create<CampaignWizardState>((set) => ({
  ...initialState,
  setStep: (step) => set({ step }),
  setCampaignName: (campaignName) => set({ campaignName }),
  setDescription: (description) => set({ description }),
  setChannel: (channel) =>
    set((state) => {
      const channelChanged = state.channelId !== channel.id;
      return {
        channelId: channel.id,
        deviceId: channel.id,
        channelName: channel.label,
        phoneNumber: channel.phone_number ?? "",
        ...(channelChanged
          ? {
              templateId: "",
              variableMapping: {},
              sampleValues: {},
              headerMediaUrl: "",
              headerVariableMapping: {},
              includeHeader: true,
              includeFooter: true,
            }
          : {}),
      };
    }),
  setTemplateId: (templateId) =>
    set((state) => {
      if (state.templateId === templateId) {
        return state;
      }
      return {
        templateId,
        variableMapping: {},
        sampleValues: {},
        headerMediaUrl: "",
        headerVariableMapping: {},
        includeHeader: true,
        includeFooter: true,
      };
    }),
  setVariableMapping: (variableMapping) => set({ variableMapping }),
  setSampleValues: (sampleValues) => set({ sampleValues }),
  setHeaderMediaUrl: (headerMediaUrl) => set({ headerMediaUrl }),
  setHeaderVariableMapping: (headerVariableMapping) => set({ headerVariableMapping }),
  setIncludeHeader: (includeHeader) => set({ includeHeader }),
  setIncludeFooter: (includeFooter) => set({ includeFooter }),
  setSelectedTagIds: (selectedTagIds) => set({ selectedTagIds }),
  setSendMode: (sendMode) => set({ sendMode }),
  setScheduleDate: (scheduleDate) => set({ scheduleDate }),
  setScheduleTime: (scheduleTime) => set({ scheduleTime }),
  setTimezone: (timezone) => set({ timezone }),
  reset: () => set(initialState),
}));
