"use client";

import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type TemplateFooterEditorProps = {
  footer: string;
  onChange: (footer: string) => void;
  onRemove?: () => void;
};

export function TemplateFooterEditor({ footer, onChange, onRemove }: TemplateFooterEditorProps) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm font-medium">Footer (Opsional)</div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <button type="button" className="rounded p-1 hover:bg-accent" aria-label="Move up">
            <ChevronUp className="h-4 w-4" />
          </button>
          <button type="button" className="rounded p-1 hover:bg-accent" aria-label="Move down">
            <ChevronDown className="h-4 w-4" />
          </button>
          {onRemove ? (
            <button
              type="button"
              className="rounded p-1 text-destructive hover:bg-destructive/10"
              onClick={onRemove}
              aria-label="Remove footer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="template-footer" className="sr-only">
            Footer
          </Label>
          <span className="ml-auto text-xs text-muted-foreground">{footer.length}/60</span>
        </div>
        <Input
          id="template-footer"
          value={footer}
          maxLength={60}
          placeholder="Tulis footer pendek di sini (maks. 60 karakter)"
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}
