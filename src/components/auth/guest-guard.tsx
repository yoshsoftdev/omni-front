"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuthStore } from "@/store/auth-store";

export function GuestGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const persist = useAuthStore.persist;
    if (!persist) {
      setReady(true);
      return;
    }

    if (persist.hasHydrated()) {
      setReady(true);
      return;
    }

    const unsub = persist.onFinishHydration(() => setReady(true));
    return unsub;
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (isAuthenticated()) {
      router.replace("/dashboard");
    }
  }, [ready, isAuthenticated, router]);

  if (!ready) {
    return null;
  }

  if (isAuthenticated()) {
    return null;
  }

  return <>{children}</>;
}
