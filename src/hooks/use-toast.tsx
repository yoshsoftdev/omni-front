"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useCallback, useState } from "react";

export function useToast() {
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const notify = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2400);
  }, []);

  function Toast() {
    if (!toast) return null;
    return (
      <div role="status" aria-live="polite" className="fixed right-6 top-6 z-[80]">
        <div
          className={[
            "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm shadow-lg",
            toast.type === "success" ? "border-success-border bg-success-muted text-success-foreground" : "border-error-border bg-error-muted text-error-foreground",
          ].join(" ")}
        >
          {toast.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {toast.message}
        </div>
      </div>
    );
  }

  return { notify, Toast };
}
