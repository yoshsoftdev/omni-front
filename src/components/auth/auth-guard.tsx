"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { authService } from "@/features/auth/services/auth.service";
import { useAuthStore } from "@/store/auth-store";

export function AuthGuard({ children }: { children: React.ReactNode }) {
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
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    // Load this session's permissions once so the UI hides what the API would refuse.
    if (useAuthStore.getState().permissions === null) {
      void authService.me().catch(() => undefined);
    }
  }, [ready, isAuthenticated, router]);

  if (!ready || !isAuthenticated()) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  return <>{children}</>;
}
