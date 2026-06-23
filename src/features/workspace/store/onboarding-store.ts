import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { OnboardingStep, OnboardingStepId } from "@/features/workspace/types/onboarding";

type OnboardingState = {
  currentStep: OnboardingStep;
  visitedSteps: OnboardingStep[];
  skippedSteps: Partial<Record<OnboardingStepId, boolean>>;
  manuallyCompletedSteps: Partial<Record<OnboardingStepId, boolean>>;
  startedAt: string;
  lastVisitedAt: string;
  setStep: (step: OnboardingStep) => void;
  markStepSkipped: (stepId: OnboardingStepId) => void;
  markStepComplete: (stepId: OnboardingStepId) => void;
  touch: () => void;
  reset: () => void;
};

const initialState = {
  currentStep: 1 as OnboardingStep,
  visitedSteps: [1] as OnboardingStep[],
  skippedSteps: {} as Partial<Record<OnboardingStepId, boolean>>,
  manuallyCompletedSteps: {} as Partial<Record<OnboardingStepId, boolean>>,
  startedAt: new Date().toISOString(),
  lastVisitedAt: new Date().toISOString(),
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      ...initialState,
      setStep: (step) =>
        set((state) => ({
          currentStep: step,
          lastVisitedAt: new Date().toISOString(),
          visitedSteps: state.visitedSteps.includes(step)
            ? state.visitedSteps
            : [...state.visitedSteps, step].sort((a, b) => a - b),
        })),
      markStepSkipped: (stepId) =>
        set((state) => ({
          skippedSteps: { ...state.skippedSteps, [stepId]: true },
          lastVisitedAt: new Date().toISOString(),
        })),
      markStepComplete: (stepId) =>
        set((state) => ({
          manuallyCompletedSteps: { ...state.manuallyCompletedSteps, [stepId]: true },
          lastVisitedAt: new Date().toISOString(),
        })),
      touch: () => set({ lastVisitedAt: new Date().toISOString() }),
      reset: () =>
        set({
          ...initialState,
          startedAt: new Date().toISOString(),
          lastVisitedAt: new Date().toISOString(),
        }),
    }),
    {
      name: "omni-chan-onboarding",
      partialize: (state) => ({
        currentStep: state.currentStep,
        visitedSteps: state.visitedSteps,
        skippedSteps: state.skippedSteps,
        manuallyCompletedSteps: state.manuallyCompletedSteps,
        startedAt: state.startedAt,
        lastVisitedAt: state.lastVisitedAt,
      }),
    },
  ),
);

export function getOnboardingProgressMeta(state: Pick<OnboardingState, "currentStep" | "visitedSteps">) {
  return {
    currentStep: state.currentStep,
    visitedSteps: state.visitedSteps,
  };
}
