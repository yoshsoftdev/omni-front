import { AGENT_PERMISSIONS, expect, mockShell, signIn, test, TEST_SESSION } from "./fixtures/api-mock";

// 9.1 (TEAM-04): the UI shows only what the session's permissions allow; the API enforces the same codes.
const CONTACT = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
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

test("an agent sees no management actions in contacts or the sidebar", async ({ page, api }) => {
  await signIn(page, "agent");
  mockShell(api, AGENT_PERMISSIONS);
  api.ok("GET", "/contacts", { items: [CONTACT], pagination: { page: 1, page_size: 10, total: 1, total_pages: 1 } });
  api.ok("GET", "/tags", { items: [] });
  api.ok("GET", "/contacts/stats", { total: 1, opt_in: 0, opt_out: 0, unknown: 1 });
  api.ok("GET", "/contacts/field-definitions", { items: [] });

  await page.goto("/contacts");
  await expect(page.getByRole("button", { name: "More actions for Budi Santoso" })).toBeVisible();

  // Granted: viewing. Not granted: create, import, edit, delete, bulk selection.
  await expect(page.getByRole("button", { name: "Add Contact" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Import Contacts" })).toHaveCount(0);
  await expect(page.getByLabel("Select Budi Santoso")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Edit Budi Santoso" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Import" })).toHaveCount(0);

  const nav = page.locator("aside nav");
  await expect(nav.getByRole("link", { name: "Contacts" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Broadcast" })).toHaveCount(0);
  await expect(nav.getByRole("link", { name: "Team" })).toHaveCount(0);
  await expect(nav.getByRole("link", { name: "Billing" })).toHaveCount(0);

  await page.getByRole("button", { name: "More actions for Budi Santoso" }).click();
  await expect(page.getByRole("menuitem", { name: "Open in Inbox" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Delete Contact" })).toHaveCount(0);
});

test("an agent can reply in the inbox but not assign", async ({ page, api }) => {
  const CONV_ID = "44444444-4444-4444-8444-444444444444";
  const conversation = {
    id: CONV_ID,
    contact_id: CONTACT.id,
    contact_name: "Budi Santoso",
    contact_phone: "+628120000001",
    device_id: "33333333-3333-4333-8333-333333333333",
    channel_type: "whatsapp",
    status: "open",
    unread_count: 0,
    last_message_at: new Date().toISOString(),
    last_customer_message_at: new Date().toISOString(),
    last_message_preview: "Halo",
  };
  await signIn(page, "agent");
  mockShell(api, AGENT_PERMISSIONS);
  api.ok("GET", "/inbox", { conversations: [conversation], has_more: false });
  api.ok("GET", `/conversations/${CONV_ID}`, conversation);
  api.ok("GET", `/conversations/${CONV_ID}/messages`, { items: [] });
  api.ok("GET", `/conversations/${CONV_ID}/activities`, []);
  api.ok("GET", `/conversations/${CONV_ID}/notes`, []);
  api.ok("GET", "/teams/members", []);
  api.ok("GET", "/quick-replies", []);
  api.ok("GET", "/contacts", { items: [] });
  api.ok("GET", "/automation/settings", { enabled: false, hasWebhook: false });
  const presence = { conversation_id: CONV_ID, viewers: [], typing: [] };
  api.ok("GET", `/conversations/${CONV_ID}/presence`, presence);
  api.ok("POST", `/conversations/${CONV_ID}/presence/open`, presence);
  api.ok("POST", `/conversations/${CONV_ID}/presence/close`, presence);

  await page.goto(`/inbox?c=${CONV_ID}`);
  await expect(page.getByRole("heading", { name: "Budi Santoso" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Reply" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Internal Note" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Assign" })).toHaveCount(0);

  await page.getByRole("button", { name: "More conversation actions" }).click();
  await expect(page.getByRole("menuitem", { name: "Close conversation" })).toBeVisible();
});
