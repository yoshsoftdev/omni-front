"use client";

import { ExternalLink, MessageCircle, Phone, Verified } from "lucide-react";

import type { WhatsAppMessagePreviewProps } from "@/features/broadcast/types/whatsapp-preview";

export function WhatsAppMessagePreview({
  heading = "Preview WhatsApp",
  deviceName,
  languageLabel,
  headerType = "none",
  headerText,
  headerPreviewUrl,
  body,
  footer,
  buttons = [],
  disclaimer = "Preview hanya contoh. Tampilan dapat berbeda di WhatsApp.",
}: WhatsAppMessagePreviewProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold">{heading}</div>
        <select className="rounded-md border bg-background px-2 py-1 text-xs" defaultValue="lang" disabled>
          <option value="lang">{languageLabel}</option>
        </select>
      </div>

      <div className="mt-3 overflow-hidden rounded-xl border bg-[#ECE5DD]">
        <div className="flex items-center gap-2 bg-[#0F9D8A] px-3 py-2.5 text-white">
          <div className="h-8 w-8 rounded-full bg-white/20" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 text-sm font-medium">
              {deviceName}
              <Verified className="h-3.5 w-3.5 fill-white text-[#0F9D8A]" />
            </div>
            <div className="text-[10px] text-white/80">Active now</div>
          </div>
        </div>

        <div className="p-3">
          <div className="ml-auto max-w-[92%] overflow-hidden rounded-lg bg-white shadow-sm">
            {headerType === "image" ? (
              headerPreviewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={headerPreviewUrl}
                  alt=""
                  className="aspect-[1.91/1] w-full object-cover"
                />
              ) : (
                <div className="aspect-[1.91/1] w-full bg-gradient-to-br from-amber-100 via-rose-50 to-teal-100" />
              )
            ) : null}
            {headerType === "video" ? (
              <div className="flex aspect-video w-full items-center justify-center bg-muted text-xs text-muted-foreground">
                Video preview
              </div>
            ) : null}
            {headerType === "document" ? (
              <div className="flex h-16 w-full items-center justify-center bg-muted text-xs text-muted-foreground">
                Document preview
              </div>
            ) : null}

            <div className="space-y-2 p-3">
              {headerType === "text" && headerText ? (
                <p className="text-sm font-semibold text-foreground">{headerText}</p>
              ) : null}
              <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">{body}</p>
              {footer ? <p className="text-xs text-muted-foreground">{footer}</p> : null}
              <div className="text-right text-[10px] text-muted-foreground">10.30</div>
            </div>

            {buttons.length > 0 ? (
              <div className="border-t">
                {buttons.map((button) => (
                  <div
                    key={button.id}
                    className="flex items-center justify-center gap-1.5 border-t px-3 py-2.5 text-sm font-medium text-[#0F9D8A] first:border-t-0"
                  >
                    {button.type === "url" ? (
                      <ExternalLink className="h-3.5 w-3.5" />
                    ) : button.type === "phone_number" ? (
                      <Phone className="h-3.5 w-3.5" />
                    ) : (
                      <MessageCircle className="h-3.5 w-3.5" />
                    )}
                    {button.text}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <p className="mt-3 text-[11px] text-muted-foreground">{disclaimer}</p>
    </div>
  );
}
