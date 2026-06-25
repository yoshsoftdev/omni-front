import { create } from "zustand";
import { persist } from "zustand/middleware";

import type {
  EmbeddedSignupProgressState,
  EmbeddedSignupRequirement,
  EmbeddedSignupResult,
  EmbeddedSignupStep,
} from "@/features/channels/types/embedded-signup";
import { EMBEDDED_SIGNUP_REQUIREMENTS } from "@/features/channels/types/embedded-signup";

type EmbeddedSignupState = {
  step: EmbeddedSignupStep;
  channelId: string | null;
  returnTo: string;
  requirements: EmbeddedSignupRequirement[];
  progressState: EmbeddedSignupProgressState;
  result: EmbeddedSignupResult | null;
  startedAt: string | null;
  setStep: (step: EmbeddedSignupStep) => void;
  setChannelId: (channelId: string | null) => void;
  setReturnTo: (returnTo: string) => void;
  toggleRequirement: (id: EmbeddedSignupRequirement["id"]) => void;
  setProgressState: (state: EmbeddedSignupProgressState) => void;
  setResult: (result: EmbeddedSignupResult | null) => void;
  reset: () => void;
};

const defaultRequirements: EmbeddedSignupRequirement[] = EMBEDDED_SIGNUP_REQUIREMENTS.map((item) => ({
  ...item,
  ready: false,
}));

const initialState = {
  step: "about" as EmbeddedSignupStep,
  channelId: null as string | null,
  returnTo: "/devices",
  requirements: defaultRequirements,
  progressState: "initializing" as EmbeddedSignupProgressState,
  result: null as EmbeddedSignupResult | null,
  startedAt: null as string | null,
};

export const useEmbeddedSignupStore = create<EmbeddedSignupState>()(
  persist(
    (set, get) => ({
      ...initialState,
      setStep: (step) =>
        set({
          step,
          startedAt: get().startedAt ?? new Date().toISOString(),
        }),
      setChannelId: (channelId) => set({ channelId }),
      setReturnTo: (returnTo) => set({ returnTo }),
      toggleRequirement: (id) =>
        set((state) => ({
          requirements: state.requirements.map((item) =>
            item.id === id ? { ...item, ready: !item.ready } : item,
          ),
        })),
      setProgressState: (progressState) => set({ progressState }),
      setResult: (result) => set({ result }),
      reset: () =>
        set({
          ...initialState,
          requirements: defaultRequirements.map((item) => ({ ...item })),
        }),
    }),
    {
      name: "omni-chan-embedded-signup",
      partialize: (state) => ({
        step: state.step,
        channelId: state.channelId,
        returnTo: state.returnTo,
        requirements: state.requirements,
        progressState: state.progressState,
        result: state.result,
        startedAt: state.startedAt,
      }),
    },
  ),
);

export function allRequirementsReady(requirements: EmbeddedSignupRequirement[]): boolean {
  return requirements.every((item) => item.ready);
}
