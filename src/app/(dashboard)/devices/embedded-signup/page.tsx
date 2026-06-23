import { Suspense } from "react";

import { EmbeddedSignupWizard } from "@/features/channels/components/embedded-signup/embedded-signup-wizard";

export default function EmbeddedSignupPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading embedded signup...</p>}>
      <EmbeddedSignupWizard />
    </Suspense>
  );
}
