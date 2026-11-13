import { callsTo, expect, mockShell, signIn, test, TEST_SESSION } from "./fixtures/api-mock";

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

test("reply to a customer from the inbox", async ({ page, api }) => {
  await signIn(page);
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
