/**
 * Runs `action` for every id, a few at a time, and counts what failed instead of stopping.
 * shortcut: one request per contact (no bulk endpoint); fine for a page of ≤100 rows, add a backend bulk route if selection grows past a page.
 */
export async function runBulk(
  ids: string[],
  action: (id: string) => Promise<unknown>,
  concurrency = 5,
): Promise<{ ok: number; failed: number }> {
  let ok = 0;
  let failed = 0;
  for (let i = 0; i < ids.length; i += concurrency) {
    const results = await Promise.allSettled(ids.slice(i, i + concurrency).map(action));
    for (const result of results) {
      if (result.status === "fulfilled") ok += 1;
      else failed += 1;
    }
  }
  return { ok, failed };
}
