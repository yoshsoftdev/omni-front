import { apiClient } from "@/services/api/client";

export interface StoredObject {
  id: string;
  team_id: string;
  object_key: string;
  storage_driver: string;
  mime_type: string;
  size_bytes: number;
  hash: string;
}

type UploadResponse = {
  object?: StoredObject;
};

export const storageService = {
  async upload(file: File, namespace = "attachments") {
    const response = await apiClient.upload<UploadResponse>("/storage/upload", file, { namespace });
    const object = response.data?.object;
    if (!object?.id) {
      throw new Error("Upload did not return a storage object");
    }
    return object;
  },

  objectContentPath(objectId: string) {
    return `/api/v1/storage/objects/${objectId}/content`;
  },
};
