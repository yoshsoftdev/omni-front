import { Instagram, Mail, MessageCircle, Send } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ProviderKind } from "@/types/contact";

const styles: Record<string, string> = {
  whatsapp: "border-success-border bg-success-muted text-success-foreground",
  instagram: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/40",
  messenger: "border-info-border bg-info-muted text-info-foreground",
  telegram: "border-info-border bg-info-muted text-info-foreground",
  email: "border-border bg-muted text-muted-foreground",
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
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
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
    <span className="inline-flex rounded-full border border-warning-border bg-warning-muted px-2 py-0.5 text-xs font-medium text-warning-foreground">
      Main Account
    </span>
  );
}
