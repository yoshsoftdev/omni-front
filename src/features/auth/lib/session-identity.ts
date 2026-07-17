export const LAST_AUTH_IDENTITY_KEY = "omni-chan-last-auth-identity";
export const APP_STORAGE_PREFIX = "omni-chan-";

export type LastAuthIdentity = {
  userId: string;
  email: string;
};

export function normalizeAuthEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function readLastAuthIdentity(): LastAuthIdentity | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LAST_AUTH_IDENTITY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LastAuthIdentity>;
    const userId = typeof parsed.userId === "string" ? parsed.userId.trim() : "";
    const email = typeof parsed.email === "string" ? normalizeAuthEmail(parsed.email) : "";
    if (!userId || !email) return null;
    return { userId, email };
  } catch {
    return null;
  }
}

export function writeLastAuthIdentity(identity: LastAuthIdentity): void {
  if (typeof window === "undefined") return;
  const userId = identity.userId.trim();
  const email = normalizeAuthEmail(identity.email);
  if (!userId || !email) return;
  window.localStorage.setItem(
    LAST_AUTH_IDENTITY_KEY,
    JSON.stringify({ userId, email }),
  );
}

export function identitiesMatch(
  previous: LastAuthIdentity | null,
  next: { userId?: string; email: string },
): boolean {
  if (!previous) return true;
  const nextEmail = normalizeAuthEmail(next.email);
  if (previous.email !== nextEmail) return false;
  const nextUserId = next.userId?.trim();
  if (nextUserId && previous.userId !== nextUserId) return false;
  return true;
}

/** Remove app-owned storage keys. Keeps last-auth identity unless told otherwise. */
export function clearAppLocalStorage(options?: { keepLastIdentity?: boolean }): void {
  if (typeof window === "undefined") return;
  const keepLastIdentity = options?.keepLastIdentity !== false;
  const lastIdentity = keepLastIdentity ? readLastAuthIdentity() : null;

  const removeMatching = (storage: Storage) => {
    const keys: string[] = [];
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i);
      if (!key) continue;
      if (key === LAST_AUTH_IDENTITY_KEY || key.startsWith(APP_STORAGE_PREFIX)) {
        keys.push(key);
      }
    }
    for (const key of keys) {
      storage.removeItem(key);
    }
  };

  removeMatching(window.localStorage);
  removeMatching(window.sessionStorage);

  if (keepLastIdentity && lastIdentity) {
    writeLastAuthIdentity(lastIdentity);
  }
}

export function shouldClearStorageForNextUser(
  previous: LastAuthIdentity | null,
  next: { userId?: string; email: string },
): boolean {
  return previous !== null && !identitiesMatch(previous, next);
}
