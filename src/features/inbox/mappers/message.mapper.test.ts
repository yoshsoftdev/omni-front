import { describe, expect, it } from "vitest";

import { contentTypeFromMime, normalizeMessage } from "./message.mapper";

describe("contentTypeFromMime", () => {
  it("maps audio mime types to audio", () => {
    expect(contentTypeFromMime("audio/ogg")).toBe("audio");
    expect(contentTypeFromMime("audio/mpeg")).toBe("audio");
    expect(contentTypeFromMime("audio/mp4")).toBe("audio");
  });

  it("maps other media mime types", () => {
    expect(contentTypeFromMime("image/jpeg")).toBe("image");
    expect(contentTypeFromMime("video/mp4")).toBe("video");
    expect(contentTypeFromMime("application/pdf")).toBe("document");
  });
});

describe("normalizeMessage", () => {
  it("infers audio content type from attachment mime type", () => {
    const message = normalizeMessage({
      id: "msg-1",
      conversation_id: "conv-1",
      direction: "inbound",
      content: "Audio",
      sender_phone: "123",
      recipient_phone: "456",
      sent_at: "2026-07-17T08:00:00.000Z",
      attachment: {
        storage_object_id: "obj-1",
        mime_type: "audio/ogg; codecs=opus",
        size_bytes: 1024,
        filename: "voice.ogg",
      },
    });

    expect(message.content_type).toBe("audio");
    expect(message.attachment?.filename).toBe("voice.ogg");
  });
});
