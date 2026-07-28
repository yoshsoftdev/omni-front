import { create } from "zustand";

import type { ActionType, RecipientMode, VariableMapping } from "@/features/automation/types/action";

export type EndpointWizardStep = 1 | 2 | 3 | 4 | 5 | 6;

export type EndpointWizardDraft = {
  name: string;
  description: string;
  slug: string;
  actionType: ActionType | "";
  templateId: string;
  templateName: string;
  recipientMode: RecipientMode;
  variableMappings: VariableMapping[];
};

interface EndpointWizardState extends EndpointWizardDraft {
  step: EndpointWizardStep;
  setStep: (step: EndpointWizardStep) => void;
  setName: (value: string) => void;
  setDescription: (value: string) => void;
  setSlug: (value: string) => void;
  setActionType: (value: ActionType) => void;
  setTemplate: (templateId: string, templateName: string, mappings: VariableMapping[]) => void;
  setRecipientMode: (value: RecipientMode) => void;
  setVariableMappings: (value: VariableMapping[]) => void;
  reset: () => void;
}

const initialState: EndpointWizardDraft & { step: EndpointWizardStep } = {
  step: 1,
  name: "",
  description: "",
  slug: "",
  actionType: "",
  templateId: "",
  templateName: "",
  recipientMode: "phone",
  variableMappings: [],
};

export const useEndpointWizardStore = create<EndpointWizardState>((set) => ({
  ...initialState,
  setStep: (step) => set({ step }),
  setName: (name) => set({ name }),
  setDescription: (description) => set({ description }),
  setSlug: (slug) => set({ slug }),
  setActionType: (actionType) =>
    set((state) => ({
      actionType,
      ...(actionType !== state.actionType
        ? { templateId: "", templateName: "", variableMappings: [] }
        : {}),
    })),
  setTemplate: (templateId, templateName, variableMappings) =>
    set({ templateId, templateName, variableMappings }),
  setRecipientMode: (recipientMode) => set({ recipientMode }),
  setVariableMappings: (variableMappings) => set({ variableMappings }),
  reset: () => set({ ...initialState }),
}));
