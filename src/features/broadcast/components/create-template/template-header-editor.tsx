"use client";

import { useRef, useState } from "react";
import { FileText, ImageIcon, Trash2, Upload, Video } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  HEADER_MEDIA_ACCEPT,
  HEADER_MEDIA_MAX_BYTES,
} from "@/features/broadcast/constants/create-template";
import type { CreateTemplateForm } from "@/features/broadcast/types/create-template";
import { isMediaHeader } from "@/features/broadcast/utils/create-template.utils";
import { storageService } from "@/features/inbox/services/storage.service";
import { formatApiErrorMessage } from "@/services/api/errors";

type TemplateHeaderEditorProps = {
  form: CreateTemplateForm;
  onChange: (patch: Partial<CreateTemplateForm>) => void;
};

const headerHints: Record<"image" | "video" | "document", string> = {
  image: "JPG atau PNG. Disarankan 1125 × 600 px. Maks. 5MB.",
  video: "MP4. Maks. 16MB.",
  document: "PDF. Maks. 100MB.",
};

function MediaIcon({ type }: { type: "image" | "video" | "document" }) {
  if (type === "video") return <Video className="h-8 w-8 text-muted-foreground" />;
  if (type === "document") return <FileText className="h-8 w-8 text-muted-foreground" />;
  return <ImageIcon className="h-8 w-8 text-muted-foreground" />;
}

function clearHeaderMediaFields(): Partial<CreateTemplateForm> {
  return {
    headerType: "none",
    headerText: undefined,
    headerFileName: undefined,
    headerObjectId: undefined,
    headerPreviewUrl: undefined,
  };
}

export function TemplateHeaderEditorSection({ form, onChange }: TemplateHeaderEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (form.headerType === "none") return null;

  if (form.headerType === "text") {
    return (
      <div className="rounded-lg border bg-background p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-medium">Header — Text</div>
            <p className="mt-1 text-xs text-muted-foreground">Maksimal 60 karakter</p>
          </div>
          <button
            type="button"
            className="rounded p-1 text-destructive hover:bg-destructive/10"
            onClick={() => onChange(clearHeaderMediaFields())}
            aria-label="Hapus header"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 space-y-2">
          <div className="flex justify-end">
            <span className="text-xs text-muted-foreground">{(form.headerText ?? "").length}/60</span>
          </div>
          <Input
            id="template-header-text"
            value={form.headerText ?? ""}
            maxLength={60}
            placeholder="Judul singkat di atas pesan"
            onChange={(e) => onChange({ headerText: e.target.value })}
          />
        </div>
      </div>
    );
  }

  if (!isMediaHeader(form.headerType)) return null;

  const mediaType = form.headerType;
  const label =
    mediaType === "image" ? "Header — Image" : mediaType === "video" ? "Header — Video" : "Header — Document";

  function clearMedia() {
    if (form.headerPreviewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(form.headerPreviewUrl);
    }
    onChange(clearHeaderMediaFields());
  }

  async function handleFile(file: File) {
    setUploadError(null);
    const maxBytes = HEADER_MEDIA_MAX_BYTES[mediaType];
    if (file.size > maxBytes) {
      setUploadError(`File terlalu besar. Maks. ${Math.round(maxBytes / (1024 * 1024))}MB.`);
      return;
    }

    const previousPreview = form.headerPreviewUrl;
    const localPreview = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
    setUploading(true);
    try {
      const stored = await storageService.upload(file, "template-headers");
      if (previousPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(previousPreview);
      }
      onChange({
        headerFileName: file.name,
        headerObjectId: stored.id,
        headerPreviewUrl: localPreview,
      });
    } catch (err) {
      if (localPreview) URL.revokeObjectURL(localPreview);
      setUploadError(formatApiErrorMessage(err));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium">{label}</div>
          <p className="mt-1 text-xs text-muted-foreground">{headerHints[mediaType]}</p>
        </div>
        <button
          type="button"
          className="rounded p-1 text-destructive hover:bg-destructive/10"
          onClick={clearMedia}
          aria-label="Hapus header"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 flex gap-4">
        <div className="flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
          {mediaType === "image" && form.headerPreviewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.headerPreviewUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <MediaIcon type={mediaType} />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          {form.headerFileName ? (
            <p className="truncate text-xs font-medium" title={form.headerFileName}>
              {form.headerFileName}
              {form.headerObjectId ? (
                <span className="ml-2 font-normal text-muted-foreground">· tersimpan di storage</span>
              ) : null}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Belum ada file. Unggah sampel media untuk header.</p>
          )}

          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept={HEADER_MEDIA_ACCEPT[mediaType]}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            {uploading
              ? "Mengunggah..."
              : form.headerObjectId
                ? `Ganti ${mediaType === "image" ? "gambar" : mediaType === "video" ? "video" : "dokumen"}`
                : `Unggah ${mediaType === "image" ? "gambar" : mediaType === "video" ? "video" : "dokumen"}`}
          </Button>
          {uploadError ? <p className="text-xs text-destructive">{uploadError}</p> : null}
        </div>
      </div>
    </div>
  );
}
