import { describe, expect, it } from "vitest";

import { formatAudioDuration } from "./authenticated-audio";

describe("formatAudioDuration", () => {
  it("formats seconds as minutes and zero-padded seconds", () => {
    expect(formatAudioDuration(0)).toBe("0:00");
    expect(formatAudioDuration(9.9)).toBe("0:09");
    expect(formatAudioDuration(65)).toBe("1:05");
    expect(formatAudioDuration(3605)).toBe("60:05");
  });

  it("returns zero for invalid durations", () => {
    expect(formatAudioDuration(Number.NaN)).toBe("0:00");
    expect(formatAudioDuration(Number.POSITIVE_INFINITY)).toBe("0:00");
    expect(formatAudioDuration(-1)).toBe("0:00");
  });
});
