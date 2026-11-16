import type { Page } from "@playwright/test";

import { type ApiMock, expect, mockShell, signIn, test, TEST_SESSION } from "./fixtures/api-mock";

// 7.7: axe audit (WCAG 2.1 A + AA) of every module's main page. Serious and critical issues fail the test.
const AXE_PATH = require.resolve("axe-core/axe.min.js");

type AxeViolation = {
  id: string;
  impact: string | null;
  help: string;
  nodes: { target: string[]; html: string; failureSummary?: string }[];
};

async function audit(page: Page): Promise<AxeViolation[]> {
  await page.addScriptTag({ path: AXE_PATH });
  const result = await page.evaluate(async () => {
    const axe = (window as unknown as { axe: { run: (ctx: Document, opts: unknown) => Promise<{ violations: AxeViolation[] }> } }).axe;
    return axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } });
  });
  return result.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
}

function describe(violations: AxeViolation[]) {
  return violations.map(
    (v) =>
      `${v.impact} ${v.id}: ${v.help} → ${v.nodes
        .slice(0, 3)
        .map((n) => `${n.html.slice(0, 160)} (${(n.failureSummary ?? "").replace(/\s+/g, " ").slice(0, 200)})`)
        .join(" | ")}`,
  );
}

const CHANNEL = {
  id: "33333333-3333-4333-8333-333333333333",
  team_id: TEST_SESSION.team.id,
  name: "Toko Utama",
  provider: "meta_whatsapp",
  channel_type: "whatsapp",
  status: "connected",
  connection_type: "manual",
  phone_number: "+628110000000",
};
const CONVERSATION = {
  id: "44444444-4444-4444-8444-444444444444",
  contact_id: "55555555-5555-4555-8555-555555555555",
  contact_name: "Budi Santoso",
  contact_phone: "+628120000001",
  device_id: CHANNEL.id,
  channel_type: "whatsapp",
  status: "open",
  unread_count: 1,
  last_message_at: new Date().toISOString(),
  last_customer_message_at: new Date().toISOString(),
  last_message_preview: "Halo, stok masih ada?",
};
const CONTACT = {
  id: CONVERSATION.contact_id,
  team_id: TEST_SESSION.team.id,
  contact_name: "Budi Santoso",
  customer_name: "Budi Santoso",
  phone: "+628120000001",
  source: "manual",
  marketing_status: "unknown",
  tags: [],
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
};

function mockAll(api: ApiMock) {
  mockShell(api);
  api.ok("GET", "/channels", { items: [CHANNEL] });
  api.ok("GET", "/inbox", { conversations: [CONVERSATION], has_more: false });
  api.ok("GET", "/contacts", { items: [CONTACT], pagination: { page: 1, page_size: 10, total: 1, total_pages: 1 } });
  api.ok("GET", "/contacts/stats", { total: 1, opt_in: 0, opt_out: 0, unknown: 1 });
  api.ok("GET", "/contacts/field-definitions", { items: [] });
  api.ok("GET", "/tags", { items: [] });
  api.ok("GET", "/teams/members", []);
  api.ok("GET", "/teams/users", { users: [] });
  api.ok("GET", "/teams/roles", { roles: [] });
  api.ok("GET", "/teams/permissions", { matrix: [] });
  api.ok("GET", "/quick-replies", []);
  api.ok("GET", "/inbox/settings/welcome", { enabled: true, text: "Halo!" });
  api.ok("GET", "/inbox/keyword-rules", {
    items: [{ id: "r1", keywords: ["harga"], match_type: "contains", reply_text: "Daftar harga", enabled: true, sort_order: 1, created_at: "", updated_at: "" }],
  });
  api.ok("GET", "/automation/settings", { enabled: false, hasWebhook: false });
  api.ok("GET", "/automation/summary", {});
  api.ok("GET", "/automation/endpoints", { items: [], total: 0 });
  api.ok("GET", "/templates", { items: [], pagination: { page: 1, page_size: 8, total: 0, total_pages: 1 } });
  api.ok("GET", "/campaigns", { items: [] });
  api.ok("GET", "/campaigns/reports/overview", {});
  api.ok("GET", `/channels/${CHANNEL.id}/payment-status`, { status: "configured", message: "", has_primary_funding: true });
  api.ok("GET", `/channels/${CHANNEL.id}/health`, { healthy: true, checks: { token: true, waba: true, phone: true, templates_api: true } });
  api.ok("GET", `/channels/${CHANNEL.id}/sync/status`, {});
}

const PAGES: { name: string; path: string; ready: (page: Page) => Promise<void> }[] = [
  { name: "inbox", path: "/inbox", ready: (p) => expect(p.getByText("Budi Santoso").first()).toBeVisible() },
  { name: "contacts", path: "/contacts", ready: (p) => expect(p.getByLabel("Select Budi Santoso")).toBeVisible() },
  { name: "contact import", path: "/contacts/import", ready: (p) => expect(p.getByText("Drag and drop your file here")).toBeVisible() },
  { name: "campaign wizard", path: "/broadcast/campaigns/create", ready: (p) => expect(p.getByLabel("Campaign Name")).toBeVisible() },
  { name: "templates", path: "/broadcast/templates", ready: (p) => expect(p.getByRole("heading", { name: "Template WhatsApp" })).toBeVisible() },
  { name: "channels", path: "/devices", ready: (p) => expect(p.getByRole("list", { name: "Readiness checklist" })).toBeVisible() },
  { name: "automation", path: "/automation/endpoints", ready: (p) => expect(p.getByRole("heading", { name: "API Endpoints" })).toBeVisible() },
  { name: "team users", path: "/team/users", ready: (p) => expect(p.getByRole("button", { name: "Invite User" })).toBeVisible() },
  { name: "quick replies", path: "/settings/quick-replies", ready: (p) => expect(p.locator("main")).toBeVisible() },
  { name: "auto reply", path: "/settings/auto-reply", ready: (p) => expect(p.getByRole("cell", { name: "harga", exact: true })).toBeVisible() },
];

for (const theme of ["light", "dark"] as const) {
  for (const target of PAGES) {
    test(`a11y (${theme}): ${target.name} has no serious or critical axe violations`, async ({ page, api }) => {
      // next-themes defaults to light and reads the stored choice.
      await page.addInitScript((t) => localStorage.setItem("theme", t), theme);
      await signIn(page);
      mockAll(api);
      await page.goto(target.path);
      await target.ready(page);
      await expect(page.locator("html")).toHaveClass(theme === "dark" ? /\bdark\b/ : /^(?!.*\bdark\b)/);
      expect(describe(await audit(page))).toEqual([]);
    });
  }
}
