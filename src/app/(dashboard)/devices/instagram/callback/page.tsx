"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function InstagramOAuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams();
    const oauthError = searchParams.get("error_description") || searchParams.get("error");
    if (oauthError) {
      params.set("instagram", "error");
      params.set("message", oauthError);
    }
    const next = params.toString();
    router.replace(next ? `/devices?${next}` : "/devices");
  }, [router, searchParams]);

  return <p className="p-8 text-sm text-muted-foreground">Redirecting...</p>;
}

export default function InstagramOAuthCallbackPage() {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-muted-foreground">Loading...</p>}>
      <InstagramOAuthCallbackInner />
    </Suspense>
  );
}
