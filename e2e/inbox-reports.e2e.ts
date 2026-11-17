import { AGENT_PERMISSIONS, expect, mockShell, signIn, test } from "./fixtures/api-mock";

const INBOX_ANALYTICS = {
  summary: {
    conversations_started: 12,
    messages_received: 40,
    messages_sent_by_agents: 31,
    first_response_median_seconds: 150,
    first_response_p90_seconds: 7380,
    resolved: 9,
    resolution_median_seconds: null,
    unanswered: 2,
    open_now: 5,
  },
  daily: [
    { date: "2026-11-15", conversations_started: 5, messages_received: 15, resolved: 4 },
    { date: "2026-11-16", conversations_started: 7, messages_received: 25, resolved: 5 },
  ],
  agents: [
    { user_id: "u1", name: "Sari Dewi", messages_sent: 20, resolved: 6, first_response_median_seconds: 90, open_assigned: 3 },
  ],
};

// 9.3: inbox analytics and the agent report.
test("inbox reports show response times, volume and per-agent work", async ({ page, api }) => {
  const urls: string[] = [];
  await signIn(page);
  mockShell(api);
  api.on("GET", "/reports/inbox", async (route, request) => {
    urls.push(request.url());
    await route.fulfill({ json: { success: true, data: INBOX_ANALYTICS } });
  });

  await page.goto("/reports/inbox");
  const summary = page.getByRole("region", { name: "Summary" });
  await expect(summary.getByText("2m 30s")).toBeVisible(); // median first response
  await expect(summary.getByText("2h 3m")).toBeVisible(); // p90
  await expect(summary.getByText("—")).toBeVisible(); // no resolution sample
  await expect(page.getByRole("row", { name: /Sari Dewi 20 6 1m 30s 3/ })).toBeVisible();

  // The daily chart's numbers are also available as a table.
  await page.getByText("Show as table").click();
  await expect(page.getByRole("cell", { name: "25" })).toBeVisible();

  const first = new URL(urls[0]);
  expect(first.searchParams.get("tz")).toBeTruthy();
  const span = Date.parse(first.searchParams.get("to")!) - Date.parse(first.searchParams.get("from")!);
  expect(Math.round(span / 86_400_000)).toBe(7);

  // Dev mode may fetch the initial range twice, so look for the 30-day request rather than counting.
  const spanDays = (u: string) =>
    Math.round((Date.parse(new URL(u).searchParams.get("to")!) - Date.parse(new URL(u).searchParams.get("from")!)) / 86_400_000);
  await page.getByLabel("Date range").selectOption("30");
  await expect.poll(() => urls.some((u) => spanDays(u) === 30)).toBe(true);
  expect(api.unmatched.map((c) => `${c.method} ${c.path}`)).toEqual([]);
});

test("agents do not get the inbox reports link", async ({ page, api }) => {
  await signIn(page, "agent");
  mockShell(api, AGENT_PERMISSIONS);
  api.ok("GET", "/contacts", { items: [], pagination: { page: 1, page_size: 10, total: 0, total_pages: 1 } });
  api.ok("GET", "/tags", { items: [] });
  api.ok("GET", "/contacts/stats", { total: 0, opt_in: 0, opt_out: 0, unknown: 0 });
  api.ok("GET", "/contacts/field-definitions", { items: [] });

  await page.goto("/contacts");
  const nav = page.locator("aside nav");
  await expect(nav.getByRole("link", { name: "Contacts" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Inbox Reports" })).toHaveCount(0);
});
