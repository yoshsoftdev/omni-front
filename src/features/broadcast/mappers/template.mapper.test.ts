import { describe, expect, it } from "vitest";

import { mapTemplateDtoToTemplate } from "@/features/broadcast/mappers/template.mapper";
import type { TemplateDTO } from "@/types/broadcast";

describe("mapTemplateDtoToTemplate header storage", () => {
  it("marks media header storage_backed when storage_object_id is present", () => {
    const dto: TemplateDTO = {
      id: "t1",
      name: "promo",
      language: "id",
      status: "APPROVED",
      components: [
        {
          type: "HEADER",
          format: "IMAGE",
          example: {
            header_handle: ["4::meta-handle"],
            storage_object_id: ["11111111-1111-1111-1111-111111111111"],
          },
        },
        { type: "BODY", text: "Halo {{1}}" },
      ],
      created_at: new Date(0).toISOString(),
      updated_at: new Date(0).toISOString(),
    };
    const template = mapTemplateDtoToTemplate(dto);
    expect(template.header.type).toBe("image");
    expect(template.header.storage_backed).toBe(true);
  });

  it("falls back to metadata.storage_object_id", () => {
    const dto: TemplateDTO = {
      id: "t2",
      name: "promo",
      language: "id",
      components: [
        { type: "HEADER", format: "IMAGE", example: { header_handle: ["4::only-handle"] } },
        { type: "BODY", text: "Halo" },
      ],
      metadata: { storage_object_id: ["22222222-2222-2222-2222-222222222222"] },
      created_at: new Date(0).toISOString(),
      updated_at: new Date(0).toISOString(),
    };
    expect(mapTemplateDtoToTemplate(dto).header.storage_backed).toBe(true);
  });

  it("does not treat Meta header_handle alone as storage-backed", () => {
    const dto: TemplateDTO = {
      id: "t3",
      name: "synced",
      language: "en_US",
      components: [
        { type: "HEADER", format: "IMAGE", example: { header_handle: ["4::abc"] } },
        { type: "BODY", text: "Hi" },
      ],
      created_at: new Date(0).toISOString(),
      updated_at: new Date(0).toISOString(),
    };
    expect(mapTemplateDtoToTemplate(dto).header.storage_backed).toBeFalsy();
  });
});
