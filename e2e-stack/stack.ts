import { createHmac, randomUUID } from "node:crypto";

import { type APIRequestContext, type Page, expect } from "@playwright/test";

// Endpoints of the deployed stack (defaults = docker-compose.staging.yml on 127.0.0.1).
export const API = process.env.E2E_API_URL ?? "http://127.0.0.1:8070/api/v1";
export const WEBHOOK = process.env.E2E_WEBHOOK_URL ?? "http://127.0.0.1:8090/api/v1/webhooks/meta";
const APP_SECRET = process.env.E2E_META_APP_SECRET ?? "";
// Fake Meta Graph from docker-compose.e2e.yml: records what the backend "sent to Meta".
const FAKE_GRAPH = process.env.E2E_FAKE_GRAPH_URL ?? "http://127.0.0.1:8099";
export const PASSWORD = "Passw0rd!e2e";

if (!APP_SECRET) throw new Error("E2E_META_APP_SECRET is required (META_APP_SECRET of the deployed stack)");

export type Account = { email: string; token: string; teamId: string };

/** A fresh workspace per test keeps tests independent and parallel-safe. */
export async function register(request: APIRequestContext): Promise<Account> {
  const email = `e2e-${randomUUID()}@test.local`;
  const res = await request.post(`${API}/auth/register`, {
    data: { name: "E2E Owner", email, password: PASSWORD, team_name: "E2E Team" },
  });
  expect(res.status(), await res.text()).toBe(201);
  const { data } = await res.json();
  return { email, token: data.access_token, teamId: data.team.id };
}

/** Fake Graph convention: WABA "w<pnid>" owns phone "<pnid>"; token "bad-token" is rejected. */
export function newPhoneNumberId(): string {
  return `e2e${Date.now()}${Math.floor(Math.random() * 1e6)}`;
}

/** Creates a WhatsApp channel through the real API (manual connect, verified against the fake Graph). */
export async function createWhatsAppChannel(
  request: APIRequestContext,
  token: string,
): Promise<{ channelId: string; phoneNumberId: string }> {
  const phoneNumberId = newPhoneNumberId();
  const res = await request.post(`${API}/channels`, {
    headers: { authorization: `Bearer ${token}` },
    data: {
      name: "E2E WhatsApp",
      provider: "meta_whatsapp",
      connection_type: "manual",
      phone_number: "+628110000001",
      access_token: "e2e-token",
      waba_id: `w${phoneNumberId}`,
      phone_number_id: phoneNumberId,
    },
  });
  expect(res.status(), await res.text()).toBe(201);
  const { data } = await res.json();
  return { channelId: data.id, phoneNumberId };
}

export type SentToMeta = { phone_number_id: string; to: string; type: string; text: string | null; wamid: string };

/** Messages the backend delivered to (fake) Meta for one customer. */
export async function sentToMeta(request: APIRequestContext, to: string): Promise<SentToMeta[]> {
  const res = await request.get(`${FAKE_GRAPH}/_sent?to=${encodeURIComponent(to)}`);
  expect(res.ok(), "fake Graph reachable — was the stack started with docker-compose.e2e.yml?").toBeTruthy();
  return (await res.json()).data;
}

export type Inbound = { phoneNumberId: string; from: string; name: string; text: string; wamid?: string };

export function inboundPayload(m: Inbound) {
  return {
    object: "whatsapp_business_account",
    entry: [
      {
        id: `w${m.phoneNumberId}`,
        changes: [
          {
            field: "messages",
            value: {
              messaging_product: "whatsapp",
              metadata: { display_phone_number: "628110000001", phone_number_id: m.phoneNumberId },
              contacts: [{ profile: { name: m.name }, wa_id: m.from }],
              messages: [
                {
                  from: m.from,
                  id: m.wamid ?? `wamid.E2E${randomUUID().replace(/-/g, "")}`,
                  timestamp: String(Math.floor(Date.now() / 1000)),
                  type: "text",
                  text: { body: m.text },
                },
              ],
            },
          },
        ],
      },
    ],
  };
}

/** POSTs a Meta webhook signed like Meta does (X-Hub-Signature-256 over the raw body). */
export async function sendWebhook(request: APIRequestContext, payload: unknown, signature?: string) {
  const body = JSON.stringify(payload);
  const sig = signature ?? `sha256=${createHmac("sha256", APP_SECRET).update(body).digest("hex")}`;
  return request.post(WEBHOOK, {
    headers: { "content-type": "application/json", "x-hub-signature-256": sig },
    data: body,
  });
}

type Conversation = { id: string; contact_name?: string; contact_phone?: string; last_message_preview?: string };
type Message = { id: string; direction: string; content: string; status?: string };

export async function conversations(request: APIRequestContext, token: string): Promise<Conversation[]> {
  const res = await request.get(`${API}/conversations`, { headers: { authorization: `Bearer ${token}` } });
  expect(res.ok(), await res.text()).toBeTruthy();
  const { data } = await res.json();
  return Array.isArray(data) ? data : (data.items ?? []);
}

export async function messages(request: APIRequestContext, token: string, conversationId: string): Promise<Message[]> {
  const res = await request.get(`${API}/conversations/${conversationId}/messages`, {
    headers: { authorization: `Bearer ${token}` },
  });
  expect(res.ok(), await res.text()).toBeTruthy();
  const { data } = await res.json();
  return Array.isArray(data) ? data : (data.items ?? []);
}

/** Waits until the async pipeline (webhook → NATS → event-consumer → DB) has produced the conversation. */
export async function waitForConversation(request: APIRequestContext, token: string, name: string): Promise<Conversation> {
  let found: Conversation | undefined;
  await expect
    .poll(async () => {
      found = (await conversations(request, token)).find((c) => c.contact_name === name);
      return Boolean(found);
    }, { timeout: 20_000, message: `conversation with ${name}` })
    .toBe(true);
  return found!;
}

export async function loginUI(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}
