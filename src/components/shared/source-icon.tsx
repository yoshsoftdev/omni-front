import { Globe, Instagram, MessageCircle, Upload, UserPlus } from "lucide-react";
import type { ContactSource } from "@/types/contact";

export function SourceIcon({ source, className }: { source: ContactSource; className?: string }) {
  const props = { className: className ?? "h-4 w-4" };
  if (source === "ig") return <Instagram {...props} />;
  if (source === "whatsapp" || source === "meta_inbound") return <MessageCircle {...props} />;
  if (source === "import") return <Upload {...props} />;
  if (source === "api") return <Globe {...props} />;
  return <UserPlus {...props} />;
}

export function sourceLabel(source: ContactSource) {
  const map: Record<ContactSource, string> = {
    whatsapp: "WhatsApp",
    meta_inbound: "WhatsApp",
    ig: "Instagram",
    import: "Import",
    manual: "Manual",
    api: "API",
  };
  return map[source];
}
