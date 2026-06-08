"use client";

import { ChevronDown, ChevronUp, ImageIcon, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { CreateTemplateForm, HeaderType } from "@/features/broadcast/types/create-template";

type TemplateHeaderEditorProps = {
  headerType: HeaderType;
  fileName?: string;
  onFileNameChange: (fileName: string) => void;
  onRemove: () => void;
};

const headerHints: Record<Exclude<HeaderType, "none">, string> = {
  image: "Gambar untuk header template. Format: JPG, PNG. Disarankan ukuran 1200 x 628px",
  video: "Video untuk header template. Format: MP4. Maks. 16MB",
  document: "Dokumen untuk header template. Format: PDF. Maks. 100MB",
};

export function TemplateHeaderEditor({
  headerType,
  fileName,
  onFileNameChange,
  onRemove,
}: TemplateHeaderEditorProps) {
  if (headerType === "none") return null;

  const label =
    headerType === "image" ? "Header (Image)" : headerType === "video" ? "Header (Video)" : "Header (Document)";

  function handleMockUpload() {
    if (headerType === "none") return;
    const mockNames: Record<Exclude<HeaderType, "none">, string> = {
      image: "hydrabalance-product.jpg",
      video: "promo-video.mp4",
      document: "catalog.pdf",
    };
    onFileNameChange(mockNames[headerType]);
  }

  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm font-medium">{label}</div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <button type="button" className="rounded p-1 hover:bg-accent" aria-label="Move up">
            <ChevronUp className="h-4 w-4" />
          </button>
          <button type="button" className="rounded p-1 hover:bg-accent" aria-label="Move down">
            <ChevronDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded p-1 text-destructive hover:bg-destructive/10"
            onClick={onRemove}
            aria-label="Remove header"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 flex gap-4">
        {headerType === "image" ? (
          <div className="flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
            <div className="h-full w-full bg-gradient-to-br from-amber-100 via-rose-50 to-teal-100" />
          </div>
        ) : (
          <div className="flex h-20 w-28 shrink-0 items-center justify-center rounded-md border bg-muted">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          </div>
        )}

        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-xs text-muted-foreground">{headerHints[headerType]}</p>
          {fileName ? <p className="truncate text-xs font-medium">{fileName}</p> : null}
          <Button type="button" variant="outline" size="sm" onClick={handleMockUpload}>
            <Upload className="h-4 w-4" />
            Ganti {headerType === "image" ? "Gambar" : headerType === "video" ? "Video" : "Dokumen"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function TemplateHeaderEditorSection({
  form,
  onChange,
}: {
  form: CreateTemplateForm;
  onChange: (patch: Partial<CreateTemplateForm>) => void;
}) {
  return (
    <TemplateHeaderEditor
      headerType={form.headerType}
      fileName={form.headerFileName}
      onFileNameChange={(fileName) => onChange({ headerFileName: fileName })}
      onRemove={() => onChange({ headerType: "none", headerFileName: undefined })}
    />
  );
}
