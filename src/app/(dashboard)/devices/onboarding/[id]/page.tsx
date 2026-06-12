"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { OnboardingWizard } from "@/features/devices/components/onboarding-wizard";
import { deviceService } from "@/features/devices/services/device.service";

export default function DeviceOnboardingPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const deviceId = params.id;
  const [deviceName, setDeviceName] = useState("Device");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    deviceService
      .list()
      .then((devices) => {
        const device = devices.find((item) => item.id === deviceId);
        if (!device) {
          router.replace("/devices");
          return;
        }
        if (!device.is_coex) {
          router.replace("/devices");
          return;
        }
        if (device.onboarding?.status === "completed") {
          router.replace("/inbox");
          return;
        }
        setDeviceName(device.name);
      })
      .finally(() => setLoading(false));
  }, [deviceId, router]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Memuat onboarding...</p>;
  }

  return <OnboardingWizard deviceId={deviceId} deviceName={deviceName} />;
}
