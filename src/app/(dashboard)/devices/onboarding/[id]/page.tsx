"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { OnboardingWizard } from "@/features/devices/components/onboarding-wizard";
import { channelQueryService } from "@/features/channels/services/channel-query.service";

export default function DeviceOnboardingPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const channelId = params.id;
  const [channelLabel, setChannelLabel] = useState("Channel");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    channelQueryService
      .getChannels()
      .then((channels) => {
        const channel = channels.find((item) => item.id === channelId);
        if (!channel) {
          router.replace("/devices");
          return;
        }
        if (!channel.is_coex) {
          router.replace("/devices");
          return;
        }
        if (channel.onboarding?.status === "completed") {
          router.replace("/inbox");
          return;
        }
        setChannelLabel(channel.label);
      })
      .finally(() => setLoading(false));
  }, [channelId, router]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading onboarding...</p>;
  }

  return <OnboardingWizard deviceId={channelId} deviceName={channelLabel} />;
}
