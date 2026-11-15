import type { WebSocketRoute } from "@playwright/test";

import { type ApiMock, callsTo, expect, mockShell, signIn, test, TEST_SESSION } from "./fixtures/api-mock";

const CONV_ID = "44444444-4444-4444-8444-444444444444";
const now = () => new Date().toISOString();

const conversation = () => ({
  id: CONV_ID,
  contact_id: "55555555-5555-4555-8555-555555555555",
  contact_name: "Budi Santoso",
  contact_phone: "+628120000001",
  device_id: "33333333-3333-4333-8333-333333333333",
  channel_type: "whatsapp",
  status: "open",
  unread_count: 1,
  last_message_at: now(),
  last_customer_message_at: now(),
  last_message_preview: "Halo, stok masih ada?",
});

const inbound = () => ({
  id: "66666666-6666-4666-8666-666666666666",
  conversation_id: CONV_ID,
  direction: "inbound",
  content: "Halo, stok masih ada?",
  content_type: "text",
  sender_phone: "+628120000001",
  sent_at: now(),
});

function mockInbox(api: ApiMock) {
  mockShell(api);
  api.ok("GET", "/inbox", { conversations: [conversation()], has_more: false });
  api.ok("GET", `/conversations/${CONV_ID}`, conversation());
  api.ok("GET", `/conversations/${CONV_ID}/messages`, { items: [inbound()] });
  api.ok("GET", `/conversations/${CONV_ID}/activities`, []);
  api.ok("GET", `/conversations/${CONV_ID}/notes`, []);
  api.ok("POST", `/conversations/${CONV_ID}/read`, { ...conversation(), unread_count: 0 });
  api.ok("GET", "/teams/members", []);
  api.ok("GET", "/quick-replies", []);
  api.ok("GET", "/contacts", { items: [] });
  api.ok("GET", "/automation/settings", { enabled: false, hasWebhook: false });
  const presence = { conversation_id: CONV_ID, viewers: [], typing: [] };
  api.ok("GET", `/conversations/${CONV_ID}/presence`, presence);
  api.ok("POST", `/conversations/${CONV_ID}/presence/open`, presence);
  api.ok("POST", `/conversations/${CONV_ID}/presence/close`, presence);
}

test("reply to a customer from the inbox", async ({ page, api }) => {
  await signIn(page);
  mockInbox(api);
  api.on("POST", `/conversations/${CONV_ID}/messages`, async (route, request) => {
    const body = JSON.parse(request.postData() ?? "{}");
    await route.fulfill({
      json: {
        success: true,
        data: {
          id: "77777777-7777-4777-8777-777777777777",
          client_message_id: body.client_message_id,
          conversation_id: CONV_ID,
          direction: "outbound",
          content: body.content,
          content_type: "text",
          sender_phone: "+628110000000",
          sent_by: TEST_SESSION.user.id,
          sent_at: now(),
          status: "sent",
        },
      },
    });
  });

  await page.goto("/inbox");
  await page.getByText("Budi Santoso").first().click();
  await expect(page.getByText("Halo, stok masih ada?").last()).toBeVisible();

  const composer = page.getByLabel("Message", { exact: true });
  await composer.fill("Masih ada kak, mau pesan berapa?");
  await composer.press("Enter");

  await expect(page.getByText("Masih ada kak, mau pesan berapa?").last()).toBeVisible();

  // Contract lock: POST /conversations/:id/messages with the typed text.
  const sent = callsTo(api, "POST", `/conversations/${CONV_ID}/messages`);
  expect(sent).toHaveLength(1);
  expect(sent[0].body).toMatchObject({ content: "Masih ada kak, mau pesan berapa?" });
  expect(sent[0].authorization).toBe(`Bearer ${TEST_SESSION.access_token}`);
  expect(api.unmatched.map((c) => `${c.method} ${c.path}`)).toEqual([]);
});

// D9: realtime fan-out is at-most-once, so a message that arrives while the
// socket is down must still appear once the socket reconnects.
test("inbox resyncs the open thread after the realtime socket reconnects", async ({ page, api }) => {
  const sockets: WebSocketRoute[] = [];
  // Keep sockets open (the default fixture closes them) so we control the drop.
  await page.routeWebSocket(/\/ws(\?|$)/, (ws) => {
    sockets.push(ws);
  });
  await signIn(page);
  mockInbox(api);

  await page.goto("/inbox");
  await page.getByText("Budi Santoso").first().click();
  await expect(page.getByText("Halo, stok masih ada?").last()).toBeVisible();
  await expect.poll(() => sockets.length).toBeGreaterThan(0);
  // Let initial loads settle (the thread may load twice while agents resolve).
  let settled = -1;
  await expect
    .poll(() => {
      const n = callsTo(api, "GET", `/conversations/${CONV_ID}/messages`).length;
      const stable = n === settled;
      settled = n;
      return stable;
    }, { intervals: [1000] })
    .toBe(true);

  // While offline the customer sends another message; no realtime event reaches the browser.
  const missed = { ...inbound(), id: "88888888-8888-4888-8888-888888888888", content: "Kalau warna merah ada?" };
  api.ok("GET", `/conversations/${CONV_ID}/messages`, { items: [missed, inbound()] });
  const before = callsTo(api, "GET", `/conversations/${CONV_ID}/messages`).length;
  await sockets[sockets.length - 1].close();

  await expect(page.getByText("Kalau warna merah ada?")).toBeVisible({ timeout: 10_000 });
  expect(callsTo(api, "GET", `/conversations/${CONV_ID}/messages`).length).toBeGreaterThan(before);
});

// 7.1: keyboard navigation, a failed thread load that can be retried, and the 24h reply window.
test("inbox keyboard navigation, thread error retry and reply window", async ({ page, api }) => {
  const OTHER_ID = "99999999-9999-4999-8999-999999999999";
  const older = new Date(Date.now() - 60_000).toISOString();
  const other = {
    ...conversation(),
    id: OTHER_ID,
    contact_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    contact_name: "Sari Dewi",
    unread_count: 0,
    last_message_at: older,
    last_customer_message_at: older,
    last_message_preview: "Terima kasih",
  };
  await signIn(page);
  mockInbox(api);
  api.ok("GET", "/inbox", { conversations: [conversation(), other], has_more: false });
  api.ok("GET", `/conversations/${OTHER_ID}`, other);
  api.fail("GET", `/conversations/${OTHER_ID}/messages`, "thread unavailable", 500);
  api.ok("GET", `/conversations/${OTHER_ID}/activities`, []);
  api.ok("GET", `/conversations/${OTHER_ID}/notes`, []);
  const presence = { conversation_id: OTHER_ID, viewers: [], typing: [] };
  api.ok("GET", `/conversations/${OTHER_ID}/presence`, presence);
  api.ok("POST", `/conversations/${OTHER_ID}/presence/open`, presence);
  api.ok("POST", `/conversations/${OTHER_ID}/presence/close`, presence);

  await page.goto("/inbox");
  await expect(page.getByText("Sari Dewi").first()).toBeVisible();

  // j from nothing selected opens the first (most recent) conversation.
  await page.keyboard.press("j");
  await expect(page.getByRole("heading", { name: "Budi Santoso" })).toBeVisible();
  await expect(page.getByText(/24h window · 2[34]h left/)).toBeVisible();

  // j again moves to the next one, whose thread fails to load: an error, not "No messages yet".
  await page.keyboard.press("j");
  await expect(page.getByRole("heading", { name: "Sari Dewi" })).toBeVisible();
  const alert = page.getByRole("alert").filter({ hasText: "thread unavailable" });
  await expect(alert).toBeVisible();
  await expect(page.getByText("No messages yet.")).toHaveCount(0);

  api.ok("GET", `/conversations/${OTHER_ID}/messages`, {
    items: [{ ...inbound(), id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", conversation_id: OTHER_ID, content: "Terima kasih" }],
  });
  await alert.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("log").getByText("Terima kasih")).toBeVisible();

  // k goes back; r focuses the composer.
  await page.keyboard.press("k");
  await expect(page.getByRole("heading", { name: "Budi Santoso" })).toBeVisible();
  await page.keyboard.press("r");
  await expect(page.getByLabel("Message", { exact: true })).toBeFocused();

  // Design-system dialogs/menus: Assign opens a modal, Escape closes it; More lists the actions.
  await page.getByRole("button", { name: "Assign" }).click();
  await expect(page.getByRole("dialog", { name: "Assign Conversation" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Assign Conversation" })).toHaveCount(0);
  await page.getByRole("button", { name: "More conversation actions" }).click();
  await expect(page.getByRole("menuitem", { name: "Close conversation" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Mark as unread" })).toBeVisible();
});
