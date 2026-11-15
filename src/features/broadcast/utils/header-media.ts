/** Where a media header comes from when the campaign is sent. */
export interface HeaderMediaSource {
  /** The template was created here with an uploaded sample file (sent via the Media Manager). */
  storedOnTemplate: boolean;
  /** A file uploaded in the campaign wizard. */
  fileObjectId?: string;
  /** A public http(s) URL. */
  url: string;
}

/**
 * Error message for a media header that cannot be sent, or null when it can.
 * Meta's review handle (`header_handle`) is never sendable, so a template synced from Meta
 * needs a file or a URL here (bug #1).
 */
export function headerMediaError(source: HeaderMediaSource): string | null {
  const url = source.url.trim();
  if (url) {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "Header media URL must be http(s)";
    } catch {
      return "Header media URL is invalid";
    }
  }
  if (source.storedOnTemplate || source.fileObjectId || url) return null;
  return "This template has a media header: upload a file or enter a public URL";
}
