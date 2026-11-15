import { describe, expect, it } from "vitest";

import { headerMediaError } from "@/features/broadcast/utils/header-media";

describe("headerMediaError", () => {
  it("requires a file or URL when the template has no stored media", () => {
    expect(headerMediaError({ storedOnTemplate: false, url: "" })).toMatch(/upload a file or enter a public URL/);
  });

  it("accepts any one source", () => {
    expect(headerMediaError({ storedOnTemplate: true, url: "" })).toBeNull();
    expect(headerMediaError({ storedOnTemplate: false, fileObjectId: "obj-1", url: "" })).toBeNull();
    expect(headerMediaError({ storedOnTemplate: false, url: " https://cdn.example.com/a.jpg " })).toBeNull();
  });

  it("rejects a bad URL even when another source exists", () => {
    expect(headerMediaError({ storedOnTemplate: true, url: "ftp://x/a.jpg" })).toBe("Header media URL must be http(s)");
    expect(headerMediaError({ storedOnTemplate: false, fileObjectId: "obj-1", url: "not a url" })).toBe(
      "Header media URL is invalid",
    );
  });
});
