"use client";

import { Upload, X } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HEADER_MEDIA_ACCEPT, HEADER_MEDIA_MAX_BYTES } from "@/features/broadcast/constants/create-template";
import { storageService } from "@/features/inbox/services/storage.service";
import { formatApiErrorMessage } from "@/services/api/errors";

type MediaType = "image" | "video" | "document";

/** Header media for a campaign: the template's stored file, a file uploaded here, or a public URL. */
export function CampaignHeaderMedia({
  mediaType,
  storedOnTemplate,
  file,
  url,
  onFileChange,
  onUrlChange,
}: {
  mediaType: MediaType;
  storedOnTemplate: boolean;
  file: { objectId: string; fileName: string } | null;
  url: string;
  onFileChange: (file: { objectId: string; fileName: string } | null) => void;
  onUrlChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFile(selected: File) {
    setUploadError(null);
    const maxBytes = HEADER_MEDIA_MAX_BYTES[mediaType];
    if (selected.size > maxBytes) {
      setUploadError(`File too large. Max ${Math.round(maxBytes / (1024 * 1024))} MB.`);
      return;
    }
    setUploading(true);
    try {
      const stored = await storageService.upload(selected, "campaign-headers");
      onFileChange({ objectId: stored.id, fileName: selected.name });
    } catch (err) {
      setUploadError(formatApiErrorMessage(err));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs leading-relaxed text-muted-foreground">
        {storedOnTemplate
          ? "This template already has a stored header file. Upload a file or enter a URL only to replace it for this campaign."
          : "This template was synced from Meta, whose review sample cannot be reused for sending. Upload the header file or enter a public URL."}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={HEADER_MEDIA_ACCEPT[mediaType]}
          aria-label={`Header ${mediaType} file`}
          onChange={(e) => {
            const selected = e.target.files?.[0];
            if (selected) void handleFile(selected);
          }}
        />
        <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
          <Upload className="h-4 w-4" />
          {uploading ? "Uploading..." : file ? `Replace ${mediaType}` : `Upload ${mediaType}`}
        </Button>
        {file ? (
          <span className="inline-flex min-w-0 items-center gap-1 text-xs">
            <span className="truncate font-medium" title={file.fileName}>
              {file.fileName}
            </span>
            <button
              type="button"
              className="rounded p-0.5 text-muted-foreground hover:text-foreground"
              aria-label="Remove uploaded header file"
              onClick={() => onFileChange(null)}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ) : null}
      </div>
      {uploadError ? (
        <p role="alert" className="text-xs text-error-foreground">
          {uploadError}
        </p>
      ) : null}

      {file ? null : (
        <div className="space-y-2">
          <Label htmlFor="header-media-url">{storedOnTemplate ? "Or a replacement URL (optional)" : "Or a public URL"}</Label>
          <Input
            id="header-media-url"
            type="url"
            placeholder="https://cdn.example.com/promo.jpg"
            value={url}
            onChange={(event) => onUrlChange(event.target.value)}
          />
        </div>
      )}
    </div>
  );
}
