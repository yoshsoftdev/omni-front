"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type TemplateBodyEditorProps = {
  body: string;
  onChange: (body: string) => void;
  onRemove?: () => void;
};

export function TemplateBodyEditor({ body, onChange, onRemove }: TemplateBodyEditorProps) {
  function appendVariable() {
    const existing = body.match(/\{\{(\d+)\}\}/g) ?? [];
    const maxNum = existing.reduce((max, match) => {
      const num = Number(match.replace(/\D/g, ""));
      return num > max ? num : max;
    }, 0);
    onChange(`${body}{{${maxNum + 1}}}`);
  }

  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium">Body (Wajib)</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Gunakan {"{{1}}"}, {"{{2}}"}, dst untuk menambahkan variabel
          </p>
        </div>
        {onRemove ? (
          <button
            type="button"
            className="rounded p-1 text-destructive hover:bg-destructive/10"
            onClick={onRemove}
            aria-label="Hapus body"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="template-body" className="sr-only">
            Body
          </Label>
          <span className="ml-auto text-xs text-muted-foreground">{body.length}/1024</span>
        </div>
        <textarea
          id="template-body"
          className="min-h-[160px] w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={body}
          maxLength={1024}
          placeholder="Tulis isi pesan template di sini..."
          onChange={(e) => onChange(e.target.value)}
        />
        <div className="flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={appendVariable}>
            <Plus className="h-4 w-4" />
            Tambah Variabel
          </Button>
        </div>
      </div>
    </div>
  );
}
