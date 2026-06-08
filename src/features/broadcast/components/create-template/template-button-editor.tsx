"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TemplateButton, TemplateButtonType } from "@/features/broadcast/types/create-template";

const buttonTypeOptions: { value: TemplateButtonType; label: string }[] = [
  { value: "url", label: "URL Button" },
  { value: "quick_reply", label: "Quick Reply Button" },
  { value: "copy_code", label: "Copy Code Button" },
];

type TemplateButtonEditorProps = {
  buttons: TemplateButton[];
  onChange: (buttons: TemplateButton[]) => void;
};

function createButton(type: TemplateButtonType): TemplateButton {
  return {
    id: `btn_${Date.now()}`,
    type,
    text: type === "url" ? "Belanja Sekarang" : type === "copy_code" ? "Salin Kode" : "Hubungi Kami",
    url: type === "url" ? "https://example.com" : undefined,
    code: type === "copy_code" ? "PROMO2024" : undefined,
  };
}

export function TemplateButtonEditor({ buttons, onChange }: TemplateButtonEditorProps) {
  function updateButton(id: string, patch: Partial<TemplateButton>) {
    onChange(buttons.map((btn) => (btn.id === id ? { ...btn, ...patch } : btn)));
  }

  function removeButton(id: string) {
    onChange(buttons.filter((btn) => btn.id !== id));
  }

  function addButton() {
    if (buttons.length >= 3) return;
    onChange([...buttons, createButton("quick_reply")]);
  }

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">Buttons (Opsional)</div>

      {buttons.map((button) => (
        <div key={button.id} className="rounded-lg border bg-background p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="grid flex-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipe Button</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={button.type}
                  onChange={(e) =>
                    updateButton(button.id, {
                      type: e.target.value as TemplateButtonType,
                      url: e.target.value === "url" ? button.url ?? "https://example.com" : undefined,
                      code: e.target.value === "copy_code" ? button.code ?? "PROMO2024" : undefined,
                    })
                  }
                >
                  {buttonTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Teks Button</Label>
                <Input
                  value={button.text}
                  maxLength={25}
                  onChange={(e) => updateButton(button.id, { text: e.target.value })}
                />
              </div>
              {button.type === "url" ? (
                <div className="space-y-2 sm:col-span-2">
                  <Label>URL</Label>
                  <Input
                    value={button.url ?? ""}
                    placeholder="https://example.com"
                    onChange={(e) => updateButton(button.id, { url: e.target.value })}
                  />
                </div>
              ) : null}
              {button.type === "copy_code" ? (
                <div className="space-y-2 sm:col-span-2">
                  <Label>Kode</Label>
                  <Input
                    value={button.code ?? ""}
                    placeholder="PROMO2024"
                    onChange={(e) => updateButton(button.id, { code: e.target.value })}
                  />
                </div>
              ) : null}
            </div>
            <button
              type="button"
              className="rounded p-1 text-destructive hover:bg-destructive/10"
              onClick={() => removeButton(button.id)}
              aria-label="Remove button"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addButton}
        disabled={buttons.length >= 3}
      >
        <Plus className="h-4 w-4" />
        Tambah Button
      </Button>
    </div>
  );
}
