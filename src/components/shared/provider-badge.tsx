import { Instagram, Mail, MessageCircle, Send } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ProviderKind } from "@/types/contact";

const styles: Record<string, string> = {
  whatsapp: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40",
  instagram: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/40",
  messenger: "border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/40",
  telegram: "border-sky-200 bg-sky-50 text-sky-700 dark:bg-sky-950/40",
  email: "border-slate-200 bg-slate-50 text-slate-700 dark:bg-slate-900",
};

export function providerLabel(provider: ProviderKind) {
  if (provider === "messenger") return "Facebook";
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}

export function ProviderIcon({ provider, className }: { provider: ProviderKind; className?: string }) {
  const props = { className: cn("h-3.5 w-3.5", className) };
  if (provider === "whatsapp") return <MessageCircle {...props} />;
  if (provider === "instagram") return <Instagram {...props} />;
  if (provider === "messenger" || provider === "telegram") return <Send {...props} />;
  return <Mail {...props} />;
}

export function ProviderBadge({
  provider,
  compact = false,
  className,
}: {
  provider: ProviderKind;
  compact?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        styles[provider] ?? styles.email,
        compact && "h-6 w-6 justify-center p-0",
        className,
      )}
      title={providerLabel(provider)}
    >
      <ProviderIcon provider={provider} />
      {compact ? null : providerLabel(provider)}
    </span>
  );
}

export function SourceOfTruthBadge() {
  return (
    <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-950/40">
      Main Account
    </span>
  );
}
