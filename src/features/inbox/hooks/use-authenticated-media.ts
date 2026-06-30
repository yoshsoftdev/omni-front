import { apiClient } from "@/services/api/client";
import { useAuthStore } from "@/store/auth-store";
import { useEffect, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";

export function useAuthenticatedMediaUrl(objectId?: string) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!objectId) {
      setUrl(null);
      return;
    }

    let active = true;
    let objectUrl: string | null = null;
    setLoading(true);
    setError(null);

    const token = useAuthStore.getState().tokens?.accessToken;
    fetch(`${API_BASE_URL}/storage/objects/${objectId}/content`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Unable to load media");
        }
        const blob = await response.blob();
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Unable to load media");
        setUrl(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectId]);

  return { url, loading, error };
}

export async function downloadAuthenticatedMedia(objectId: string, filename: string) {
  const token = useAuthStore.getState().tokens?.accessToken;
  const response = await fetch(`${API_BASE_URL}/storage/objects/${objectId}/content`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    throw new Error("Unable to download file");
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export { formatBytes };
