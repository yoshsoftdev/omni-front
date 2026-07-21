import { describe, expect, it } from "vitest";

import { isWhatsAppChannel } from "@/features/channels/utils/is-whatsapp-channel";
import type { Channel } from "@/features/channels/types/channel";
import type { CreateTemplateForm } from "@/features/broadcast/types/create-template";
import { buildMetaTemplateComponents } from "@/features/broadcast/utils/build-meta-template";
import { validateCreateTemplateForm } from "@/features/broadcast/utils/create-template.utils";

function channel(partial: Partial<Channel> & Pick<Channel, "id" | "label" | "provider">): Channel {
  return {
    status: "connected",
    is_coex: false,
    ...partial,
  };
}

const baseForm: CreateTemplateForm = {
  deviceId: "ch_1",
  name: "promo_juni_2024",
  language: "id",
  category: "marketing",
  headerType: "none",
  body: "Halo {{1}}",
  footer: "",
  buttonMode: "none",
  buttons: [],
};

describe("isWhatsAppChannel", () => {
  it("accepts whatsapp channel_type", () => {
    expect(
      isWhatsAppChannel(channel({ id: "1", label: "WA", provider: "meta", channel_type: "whatsapp" })),
    ).toBe(true);
  });

  it("rejects instagram channel_type", () => {
    expect(
      isWhatsAppChannel(
        channel({ id: "2", label: "IG", provider: "meta", channel_type: "instagram" }),
      ),
    ).toBe(false);
  });

  it("accepts meta_whatsapp provider without channel_type", () => {
    expect(
      isWhatsAppChannel(channel({ id: "3", label: "WA", provider: "meta_whatsapp" })),
    ).toBe(true);
  });

  it("rejects instagram provider", () => {
    expect(isWhatsAppChannel(channel({ id: "4", label: "IG", provider: "instagram" }))).toBe(false);
  });
});

describe("validateCreateTemplateForm", () => {
  it("requires uploaded storage object for media header", () => {
    expect(
      validateCreateTemplateForm({
        ...baseForm,
        headerType: "image",
      }),
    ).toMatch(/storage/i);
  });

  it("accepts CTA url button", () => {
    expect(
      validateCreateTemplateForm({
        ...baseForm,
        buttonMode: "cta",
        buttons: [{ id: "1", type: "url", text: "Shop", url: "https://example.com" }],
      }),
    ).toBeNull();
  });

  it("rejects mixing quick reply in cta mode", () => {
    expect(
      validateCreateTemplateForm({
        ...baseForm,
        buttonMode: "cta",
        buttons: [{ id: "1", type: "quick_reply", text: "Ok" }],
      }),
    ).toMatch(/call to action/i);
  });
});

describe("buildMetaTemplateComponents", () => {
  it("builds footer and CTA phone button", () => {
    const components = buildMetaTemplateComponents(
      {
        ...baseForm,
        footer: "Balas STOP",
        buttonMode: "cta",
        buttons: [{ id: "1", type: "phone_number", text: "Telepon", phoneNumber: "+628111" }],
      },
      [{ key: "1", placeholder: "{{1}}", sampleValue: "Ayu", fieldLabel: "name" }],
    );

    expect(components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "FOOTER", text: "Balas STOP" }),
        expect.objectContaining({
          type: "BUTTONS",
          buttons: [
            expect.objectContaining({
              type: "PHONE_NUMBER",
              text: "Telepon",
              phone_number: "+628111",
            }),
          ],
        }),
      ]),
    );
  });

  it("includes storage object id as header_handle for media", () => {
    const components = buildMetaTemplateComponents(
      {
        ...baseForm,
        headerType: "image",
        headerObjectId: "11111111-1111-1111-1111-111111111111",
      },
      [],
    );

    expect(components[0]).toEqual({
      type: "HEADER",
      format: "IMAGE",
      example: { header_handle: ["11111111-1111-1111-1111-111111111111"] },
    });
  });
});
