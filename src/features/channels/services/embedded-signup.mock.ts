import type { EmbeddedSignupResult } from "@/features/channels/types/embedded-signup";

const MOCK_WABA_NAME = "Skinsure Glow WABA";
const MOCK_PHONE = "+62 812-3456-7890";
const MOCK_WABA_ID = "waba_embedded_demo";

/** Simulates embedded signup completion without Meta SDK or API calls. */
export async function simulateEmbeddedSignupCompletion(
  deviceId: string | null,
  businessName: string,
): Promise<EmbeddedSignupResult> {
  await delay(1200);

  return {
    channel_id: deviceId ?? `ch_${Date.now()}`,
    phone_number: MOCK_PHONE,
    waba_id: MOCK_WABA_ID,
    waba_name: MOCK_WABA_NAME,
    business_name: businessName || "Your Business",
  };
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
