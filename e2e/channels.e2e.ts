import { callsTo, expect, mockShell, signIn, test, TEST_SESSION } from "./fixtures/api-mock";

test("connect a WhatsApp channel manually", async ({ page, api }) => {
  await signIn(page);
  mockShell(api);
  api.ok("POST", "/channels/manual/verify", {
    waba_name: "E2E WABA",
    phone_display: "+62 811-0000-0000",
    template_count: 3,
    checks: { token: true, waba: true, phone: true, templates_api: true },
  });
  const created = {
    id: "33333333-3333-4333-8333-333333333333",
    team_id: TEST_SESSION.team.id,
    name: "Toko Utama",
    provider: "meta_whatsapp",
    channel_type: "whatsapp",
    status: "connected",
    connection_type: "manual",
    phone_number: "+628110000000",
  };
  let saved = false;
  api.on("POST", "/channels", (route) => {
    saved = true;
    return route.fulfill({ json: { success: true, data: created } });
  });
  api.on("GET", "/channels", (route) =>
    route.fulfill({ json: { success: true, data: { items: saved ? [created] : [] } } }),
  );

  await page.goto("/devices");
  await page.getByRole("button", { name: "Connect Channel" }).first().click();
  await page.getByRole("button", { name: /WhatsApp/ }).first().click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.locator("#channel-name").first().fill("Toko Utama");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Manual Setup" }).click();

  const form = page.locator("form", { hasText: "Manual WhatsApp Connection" });
  await form.getByLabel("Channel Name", { exact: true }).fill("Toko Utama");
  await form.getByLabel("System User Token").fill("e2e-test-token");
  await form.getByLabel("WABA ID").fill("1000001");
  await form.getByLabel("Phone Number ID").fill("2000002");
  await form.getByLabel("Phone Number", { exact: true }).fill("+628110000000");
  await form.getByRole("button", { name: "Test Connection" }).click();
  await expect(form.getByText("Connection verified")).toBeVisible();
  await form.getByRole("button", { name: "Save Channel" }).click();

  // The modal closes and the list reloads with the new channel.
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByText("Toko Utama").first()).toBeVisible();

  // Contract lock: verify then create, with the manual connection payload.
  expect(callsTo(api, "POST", "/channels/manual/verify")[0]?.body).toEqual({
    access_token: "e2e-test-token",
    waba_id: "1000001",
    phone_number_id: "2000002",
  });
  expect(callsTo(api, "POST", "/channels")[0]?.body).toMatchObject({
    name: "Toko Utama",
    provider: "meta_whatsapp",
    connection_type: "manual",
    phone_number: "+628110000000",
    waba_id: "1000001",
    phone_number_id: "2000002",
  });
});
