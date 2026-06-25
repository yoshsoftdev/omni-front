import { Suspense } from "react";

import { InboxPage } from "@/features/inbox/components/inbox-page";

export default function Page() {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center p-8 text-sm text-muted-foreground">Loading inbox...</div>}>
      <InboxPage />
    </Suspense>
  );
}
