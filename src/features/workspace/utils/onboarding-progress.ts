import type { OnboardingStep } from "@/features/workspace/types/onboarding";
import { ONBOARDING_STEPS } from "@/features/workspace/types/onboarding";
import type { ReadinessCheckId, WorkspaceReadiness } from "@/features/workspace/types/workspace-readiness";

const CHECK_TO_STEP: Record<ReadinessCheckId, OnboardingStep> = {
  meta_connected: 1,
  payment_method: 1,
  templates_synced: 2,
  existing_data_synced: 2,
  contacts_available: 3,
  team_members_added: 4,
  campaign_created: 5,
};

export function isOnboardingSetupComplete(readiness: WorkspaceReadiness): boolean {
  return readiness.checks.every((check) => check.completed);
}

export function getCompletedOnboardingSteps(readiness: WorkspaceReadiness): OnboardingStep[] {
  const completed = readiness.checks
    .filter((check) => check.completed)
    .map((check) => CHECK_TO_STEP[check.id]);
  if (isOnboardingSetupComplete(readiness)) {
    return [...completed, 6];
  }
  return completed;
}

export function getRemainingOnboardingChecks(readiness: WorkspaceReadiness) {
  return readiness.checks.filter((check) => !check.completed);
}

export function estimateMinutesRemaining(readiness: WorkspaceReadiness): number {
  const incompleteSteps = ONBOARDING_STEPS.filter((step) => {
    if (step.step === 6) return false;
    const checkId = Object.entries(CHECK_TO_STEP).find(([, s]) => s === step.step)?.[0] as
      | ReadinessCheckId
      | undefined;
    if (!checkId) return false;
    const check = readiness.checks.find((item) => item.id === checkId);
    return !check?.completed;
  });
  return incompleteSteps.reduce((sum, step) => sum + step.estimatedMinutes, 0);
}
