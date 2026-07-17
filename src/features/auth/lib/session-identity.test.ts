import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";

import {
  LAST_AUTH_IDENTITY_KEY,
  clearAppLocalStorage,
  identitiesMatch,
  normalizeAuthEmail,
  readLastAuthIdentity,
  shouldClearStorageForNextUser,
  writeLastAuthIdentity,
} from "./session-identity";

describe("session-identity", () => {
  const memory = new Map<string, string>();

  beforeEach(() => {
    memory.clear();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => memory.get(key) ?? null,
        setItem: (key: string, value: string) => {
          memory.set(key, value);
        },
        removeItem: (key: string) => {
          memory.delete(key);
        },
        key: (index: number) => Array.from(memory.keys())[index] ?? null,
        get length() {
          return memory.size;
        },
      },
      sessionStorage: {
        getItem: () => null,
        setItem: () => undefined,
        removeItem: () => undefined,
        key: () => null,
        length: 0,
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("normalizes email case and whitespace", () => {
    expect(normalizeAuthEmail("  Admin@Example.com ")).toBe("admin@example.com");
  });

  it("persists and reads last auth identity", () => {
    writeLastAuthIdentity({ userId: "u1", email: "A@Example.com" });
    expect(readLastAuthIdentity()).toEqual({
      userId: "u1",
      email: "a@example.com",
    });
  });

  it("detects different email or user id", () => {
    const previous = { userId: "u1", email: "a@example.com" };
    expect(identitiesMatch(previous, { email: "a@example.com" })).toBe(true);
    expect(identitiesMatch(previous, { userId: "u1", email: "a@example.com" })).toBe(true);
    expect(identitiesMatch(previous, { email: "b@example.com" })).toBe(false);
    expect(identitiesMatch(previous, { userId: "u2", email: "a@example.com" })).toBe(false);
    expect(shouldClearStorageForNextUser(null, { email: "a@example.com" })).toBe(false);
    expect(shouldClearStorageForNextUser(previous, { email: "b@example.com" })).toBe(true);
  });

  it("clears app local storage but can keep last identity", () => {
    writeLastAuthIdentity({ userId: "u1", email: "a@example.com" });
    memory.set("omni-chan-auth", '{"tokens":{}}');
    memory.set("omni-chan-onboarding", '{"currentStep":2}');
    memory.set("unrelated-key", "keep-me");

    clearAppLocalStorage({ keepLastIdentity: true });

    expect(memory.has("omni-chan-auth")).toBe(false);
    expect(memory.has("omni-chan-onboarding")).toBe(false);
    expect(memory.get("unrelated-key")).toBe("keep-me");
    expect(memory.has(LAST_AUTH_IDENTITY_KEY)).toBe(true);
    expect(readLastAuthIdentity()?.userId).toBe("u1");
  });
});
