import { randomUUID } from "node:crypto";

import { expect, test } from "@playwright/test";

import {
  API,
  conversations,
  createWhatsAppChannel,
  inboundPayload,
  loginUI,
  messages,
  newPhoneNumberId,
  register,
  sendWebhook,
  sentToMeta,
  waitForConversation,
} from "./stack";

// Each customer gets a unique number/name so parallel tests never see each other's data.
function customer() {
  const n = String(Math.floor(Math.random() * 1e9)).padStart(9, "0");
  return { from: `62812${n}`, name: `Budi ${n}` };
}

test("login with a real account opens the dashboard", async ({ page, request }) => {
  const acc = await register(request);
  await loginUI(page, acc.email);
  await expect(page.getByText(/dashboard/i).first()).toBeVisible();
});

test("wrong password is rejected by the real backend", async ({ page, request }) => {
  const acc = await register(request);
  await page.goto("/login");
  await page.getByLabel("Email").fill(acc.email);
  await page.getByLabel("Password").fill("not-the-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("invalid email or password")).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

test("connect a WhatsApp channel through the UI (verified against Graph)", async ({ page, request }) => {
  const acc = await register(request);
  const pnid = newPhoneNumberId();
  await loginUI(page, acc.email);

  await page.goto("/devices");
  await page.getByRole("button", { name: "Connect Channel" }).first().click();
  await page.getByRole("button", { name: /WhatsApp/ }).first().click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Manual Setup" }).click();

  const form = page.locator("form", { hasText: "Manual WhatsApp Connection" });
  await form.getByLabel("Channel Name", { exact: true }).fill("Toko E2E");
  await form.getByLabel("System User Token").fill("e2e-token");
  await form.getByLabel("WABA ID").fill(`w${pnid}`);
  await form.getByLabel("Phone Number ID").fill(pnid);
  await form.getByLabel("Phone Number", { exact: true }).fill("+628110000001");
  await form.getByRole("button", { name: "Test Connection" }).click();
  await expect(form.getByText("Connection verified")).toBeVisible();
  await form.getByRole("button", { name: "Save Channel" }).click();

  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByText("Toko E2E").first()).toBeVisible();
  const res = await request.get(`${API}/channels`, { headers: { authorization: `Bearer ${acc.token}` } });
  const { data } = await res.json();
  expect(data.items.map((c: { name: string; status: string }) => [c.name, c.status])).toEqual([["Toko E2E", "connected"]]);
});

test("a channel with an expired Meta token is refused", async ({ request }) => {
  const acc = await register(request);
  const pnid = newPhoneNumberId();
  const res = await request.post(`${API}/channels`, {
    headers: { authorization: `Bearer ${acc.token}` },
    data: {
      name: "Expired",
      provider: "meta_whatsapp",
      connection_type: "manual",
      phone_number: "+628110000001",
      access_token: "bad-token",
      waba_id: `w${pnid}`,
      phone_number_id: pnid,
    },
  });
  expect(res.status()).toBe(400);
  expect(await res.text()).toContain("invalid or expired Meta access token");
});

test("webhook with a bad signature is rejected and stores nothing", async ({ request }) => {
  const acc = await register(request);
  const { phoneNumberId } = await createWhatsAppChannel(request, acc.token);
  const c = customer();
  const res = await sendWebhook(request, inboundPayload({ phoneNumberId, ...c, text: "forged" }), "sha256=deadbeef");
  expect(res.status()).toBe(401);
  await new Promise((r) => setTimeout(r, 2000));
  expect((await conversations(request, acc.token)).length).toBe(0);
});

test("inbound WhatsApp message flows webhook → NATS → consumer → inbox UI", async ({ page, request }) => {
  const acc = await register(request);
  const { phoneNumberId } = await createWhatsAppChannel(request, acc.token);
  const c = customer();
  const text = `Halo, stok masih ada? ${randomUUID().slice(0, 8)}`;

  const res = await sendWebhook(request, inboundPayload({ phoneNumberId, ...c, text }));
  expect(res.status()).toBe(200);
  const conv = await waitForConversation(request, acc.token, c.name);
  expect((await messages(request, acc.token, conv.id)).map((m) => m.content)).toContain(text);

  await loginUI(page, acc.email);
  await page.goto("/inbox");
  await page.getByText(c.name).first().click();
  await expect(page.getByText(text).last()).toBeVisible();
});

test("a message that arrives while the thread is open appears in realtime (WebSocket)", async ({ page, request }) => {
  const acc = await register(request);
  const { phoneNumberId } = await createWhatsAppChannel(request, acc.token);
  const c = customer();
  await sendWebhook(request, inboundPayload({ phoneNumberId, ...c, text: "pesan pertama" }));
  await waitForConversation(request, acc.token, c.name);

  await loginUI(page, acc.email);
  await page.goto("/inbox");
  await page.getByText(c.name).first().click();
  await expect(page.getByText("pesan pertama").last()).toBeVisible();

  const live = `pesan realtime ${randomUUID().slice(0, 8)}`;
  await sendWebhook(request, inboundPayload({ phoneNumberId, ...c, text: live }));
  // No reload: only the realtime socket (or its resync) can bring this in.
  await expect(page.getByText(live).last()).toBeVisible({ timeout: 15_000 });
});

test("Meta redelivering the same message does not duplicate it", async ({ request }) => {
  const acc = await register(request);
  const { phoneNumberId } = await createWhatsAppChannel(request, acc.token);
  const c = customer();
  const payload = inboundPayload({ phoneNumberId, ...c, text: "sekali saja", wamid: `wamid.E2EDUP${Date.now()}` });

  expect((await sendWebhook(request, payload)).status()).toBe(200);
  expect((await sendWebhook(request, payload)).status()).toBe(200);
  const conv = await waitForConversation(request, acc.token, c.name);
  await new Promise((r) => setTimeout(r, 3000)); // give the second delivery time to (not) land
  const inbound = (await messages(request, acc.token, conv.id)).filter((m) => m.content === "sekali saja");
  expect(inbound).toHaveLength(1);
});

test("agent reply from the inbox is delivered to Meta and stored", async ({ page, request }) => {
  const acc = await register(request);
  const { phoneNumberId } = await createWhatsAppChannel(request, acc.token);
  const c = customer();
  await sendWebhook(request, inboundPayload({ phoneNumberId, ...c, text: "mau pesan" }));
  const conv = await waitForConversation(request, acc.token, c.name);

  await loginUI(page, acc.email);
  await page.goto("/inbox");
  await page.getByText(c.name).first().click();
  await expect(page.getByText("mau pesan").last()).toBeVisible();

  const reply = `Siap kak ${randomUUID().slice(0, 8)}`;
  const composer = page.getByLabel("Message", { exact: true });
  await composer.fill(reply);
  await composer.press("Enter");
  await expect(page.getByText(reply).last()).toBeVisible();

  // What Meta received: a text to the customer, from this channel's phone number.
  await expect.poll(async () => (await sentToMeta(request, c.from)).map((m) => m.text)).toContain(reply);
  const delivered = (await sentToMeta(request, c.from)).find((m) => m.text === reply)!;
  expect(delivered).toMatchObject({ phone_number_id: phoneNumberId, type: "text" });

  // Stored as outbound, and the agent sees no failure.
  const stored = (await messages(request, acc.token, conv.id)).find((m) => m.content === reply);
  expect(stored?.direction).toBe("outbound");
  await expect(page.getByRole("button", { name: /Failed.*Retry/ })).toHaveCount(0);
});
