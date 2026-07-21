"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buttonModeOptions } from "@/features/broadcast/constants/create-template";
import type {
  TemplateButton,
  TemplateButtonMode,
  TemplateButtonType,
} from "@/features/broadcast/types/create-template";

type TemplateButtonEditorProps = {
  buttonMode: TemplateButtonMode;
  buttons: TemplateButton[];
  onChange: (patch: { buttonMode?: TemplateButtonMode; buttons?: TemplateButton[] }) => void;
};

function createButton(type: TemplateButtonType): TemplateButton {
  return {
    id: `btn_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type,
    text:
      type === "url"
        ? "Kunjungi Website"
        : type === "phone_number"
          ? "Hubungi Kami"
          : type === "copy_code"
            ? "Salin Kode"
            : "Ya, saya tertarik",
    url: type === "url" ? "https://example.com" : undefined,
    phoneNumber: type === "phone_number" ? "+6281234567890" : undefined,
    code: type === "copy_code" ? "PROMO2024" : undefined,
  };
}

export function TemplateButtonEditor({ buttonMode, buttons, onChange }: TemplateButtonEditorProps) {
  const maxButtons = buttonMode === "cta" ? 2 : 3;

  function setMode(mode: TemplateButtonMode) {
    if (mode === "none") {
      onChange({ buttonMode: mode, buttons: [] });
      return;
    }
    if (mode === "cta") {
      onChange({
        buttonMode: mode,
        buttons: buttons.some((b) => b.type === "url" || b.type === "phone_number")
          ? buttons.filter((b) => b.type === "url" || b.type === "phone_number").slice(0, 2)
          : [createButton("url")],
      });
      return;
    }
    onChange({
      buttonMode: mode,
      buttons: buttons.some((b) => b.type === "quick_reply")
        ? buttons.filter((b) => b.type === "quick_reply").slice(0, 3)
        : [createButton("quick_reply")],
    });
  }

  function updateButton(id: string, patch: Partial<TemplateButton>) {
    onChange({ buttons: buttons.map((btn) => (btn.id === id ? { ...btn, ...patch } : btn)) });
  }

  function removeButton(id: string) {
    const next = buttons.filter((btn) => btn.id !== id);
    onChange({
      buttons: next,
      buttonMode: next.length === 0 ? "none" : buttonMode,
    });
  }

  function addCtaButton(type: "url" | "phone_number") {
    if (buttons.length >= 2) return;
    if (buttons.some((b) => b.type === type)) return;
    onChange({ buttons: [...buttons, createButton(type)] });
  }

  function addQuickReply() {
    if (buttons.length >= 3) return;
    onChange({ buttons: [...buttons, createButton("quick_reply")] });
  }

  return (
    <div className="space-y-3 rounded-lg border bg-background p-4">
      <div>
        <div className="text-sm font-medium">Buttons (Opsional)</div>
        <p className="mt-1 text-xs text-muted-foreground">
          Seperti WhatsApp Manager: pilih Call to action atau Quick reply (tidak bisa digabung).
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="button-mode">Tipe tombol</Label>
        <select
          id="button-mode"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={buttonMode}
          onChange={(e) => setMode(e.target.value as TemplateButtonMode)}
        >
          {buttonModeOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          {buttonModeOptions.find((opt) => opt.value === buttonMode)?.hint}
        </p>
      </div>

      {buttonMode === "none" ? null : (
        <div className="space-y-3">
          {buttons.map((button, index) => (
            <div key={button.id} className="rounded-md border bg-card p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Tombol {index + 1}
                  {button.type === "url"
                    ? " · Visit website"
                    : button.type === "phone_number"
                      ? " · Call phone number"
                      : " · Quick reply"}
                </span>
                <button
                  type="button"
                  className="rounded p-1 text-destructive hover:bg-destructive/10"
                  onClick={() => removeButton(button.id)}
                  aria-label="Hapus tombol"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {buttonMode === "cta" ? (
                  <div className="space-y-2">
                    <Label>Aksi</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      value={button.type}
                      onChange={(e) => {
                        const type = e.target.value as "url" | "phone_number";
                        updateButton(button.id, {
                          type,
                          url: type === "url" ? button.url ?? "https://example.com" : undefined,
                          phoneNumber:
                            type === "phone_number" ? button.phoneNumber ?? "+6281234567890" : undefined,
                        });
                      }}
                    >
                      <option value="url">Visit website</option>
                      <option value="phone_number">Call phone number</option>
                    </select>
                  </div>
                ) : null}

                <div className={`space-y-2 ${buttonMode === "quick_reply" ? "sm:col-span-2" : ""}`}>
                  <Label>Teks tombol</Label>
                  <Input
                    value={button.text}
                    maxLength={25}
                    onChange={(e) => updateButton(button.id, { text: e.target.value })}
                  />
                </div>

                {button.type === "url" ? (
                  <div className="space-y-2 sm:col-span-2">
                    <Label>URL website</Label>
                    <Input
                      value={button.url ?? ""}
                      placeholder="https://example.com"
                      onChange={(e) => updateButton(button.id, { url: e.target.value })}
                    />
                  </div>
                ) : null}

                {button.type === "phone_number" ? (
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Nomor telepon</Label>
                    <Input
                      value={button.phoneNumber ?? ""}
                      placeholder="+6281234567890"
                      onChange={(e) => updateButton(button.id, { phoneNumber: e.target.value })}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          ))}

          {buttonMode === "cta" ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addCtaButton("url")}
                disabled={buttons.length >= maxButtons || buttons.some((b) => b.type === "url")}
              >
                <Plus className="h-4 w-4" />
                Visit website
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addCtaButton("phone_number")}
                disabled={buttons.length >= maxButtons || buttons.some((b) => b.type === "phone_number")}
              >
                <Plus className="h-4 w-4" />
                Call phone number
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addQuickReply}
              disabled={buttons.length >= maxButtons}
            >
              <Plus className="h-4 w-4" />
              Tambah Quick reply
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
