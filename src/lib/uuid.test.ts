import { afterEach, describe, expect, it, vi } from "vitest";

import { generateUUID } from "./uuid";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe("generateUUID", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses crypto.randomUUID when available", () => {
    const randomUUID = vi.fn(() => "11111111-2222-4333-8444-555555555555");
    vi.stubGlobal("crypto", { randomUUID, getRandomValues: vi.fn() });

    expect(generateUUID()).toBe("11111111-2222-4333-8444-555555555555");
    expect(randomUUID).toHaveBeenCalledOnce();
  });

  it("falls back to getRandomValues when randomUUID is missing", () => {
    const bytes = Uint8Array.from({ length: 16 }, (_, index) => index);
    vi.stubGlobal("crypto", {
      getRandomValues: (target: Uint8Array) => {
        target.set(bytes);
        return target;
      },
    });

    expect(generateUUID()).toMatch(UUID_RE);
  });

  it("falls back to Math.random when crypto is unavailable", () => {
    vi.stubGlobal("crypto", undefined);

    expect(generateUUID()).toMatch(UUID_RE);
  });
});
