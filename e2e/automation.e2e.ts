import { callsTo, expect, mockShell, signIn, test } from "./fixtures/api-mock";

const TEMPLATE = {
  id: "88888888-8888-4888-8888-888888888888",
  name: "kode_otp",
  language: "id",
  category: "AUTHENTICATION",
  status: "APPROVED",
  components: [{ type: "BODY", text: "Kode verifikasi Anda {{1}}" }],
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
};
const ENDPOINT_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

test("create an automation endpoint that sends a template", async ({ page, api }) => {
  await signIn(page);
  mockShell(api);
  api.ok("GET", "/templates", { items: [TEMPLATE] });
  api.on("POST", "/automation/endpoints", async (route, request) => {
    const body = JSON.parse(request.postData() ?? "{}");
    await route.fulfill({ status: 201, json: { success: true, data: { ...body, id: ENDPOINT_ID, status: "active" } } });
  });

  await page.goto("/automation/endpoints/new");
  const next = page.getByRole("button", { name: "Continue", exact: true });

  await page.getByLabel("Endpoint Name").fill("Kirim OTP");
  await next.click(); // → Action
  await page.getByRole("button", { name: /Send Template/ }).click();
  await next.click(); // → Template
  await page.getByRole("button", { name: /kode_otp/ }).click();
  await next.click(); // → Recipient (phone by default)
  await next.click(); // → Variables (defaults from the template)
  await next.click(); // → Review
  await page.getByRole("button", { name: "Create Endpoint" }).click();

  await expect(page).toHaveURL(new RegExp(`/automation/endpoints/${ENDPOINT_ID}$`));

  // Contract lock: one create with the chosen action and template.
  const created = callsTo(api, "POST", "/automation/endpoints");
  expect(created).toHaveLength(1);
  expect(created[0].body).toMatchObject({
    name: "Kirim OTP",
    slug: "kirim-otp",
    actionType: "send_template",
    actionConfig: { templateId: TEMPLATE.id, recipientMode: "phone" },
  });
});

// Regression: with no synced templates the wizard used to offer built-in mock
// templates, producing endpoints that fail on every invoke.
test("automation wizard never offers placeholder templates", async ({ page, api }) => {
  await signIn(page);
  mockShell(api);
  api.ok("GET", "/templates", { items: [] });

  await page.goto("/automation/endpoints/new");
  const next = page.getByRole("button", { name: "Continue", exact: true });
  await page.getByLabel("Endpoint Name").fill("Kirim OTP");
  await next.click();
  await page.getByRole("button", { name: /Send Template/ }).click();
  await next.click();

  await expect(page.getByText("No approved templates")).toBeVisible();
  await expect(page.getByRole("button", { name: /shipping_update|welcome_new_customer|flash_sale_reminder/ })).toHaveCount(0);
});

// 7.5: "Test" sends a real message, so it asks first, needs no API key, and reports the real response.
test("endpoint test send asks for confirmation and shows the live response", async ({ page, api }) => {
  const endpoint = {
    id: ENDPOINT_ID,
    workspaceId: "ws",
    name: "Kirim OTP",
    slug: "kirim-otp",
    description: "",
    method: "POST",
    status: "active",
    actionType: "send_template",
    actionConfig: {
      templateId: TEMPLATE.id,
      templateName: "kode_otp",
      recipientMode: "phone",
      variableMappings: [{ templateVariable: "1", apiParameter: "kode", required: true }],
    },
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
    lastUsedAt: null,
    stats: { totalCalls: 0, successRate: 0, failedCalls: 0, callsToday: 0, averageLatencyMs: 0 },
  };
  await signIn(page);
  mockShell(api);
  api.ok("GET", `/automation/endpoints/${ENDPOINT_ID}`, endpoint);
  api.on("POST", `/automation/endpoints/${ENDPOINT_ID}/test`, (route) =>
    route.fulfill({ json: { success: true, data: { executionId: "exec_1", status: "sent" } } }),
  );

  await page.goto(`/automation/endpoints/${ENDPOINT_ID}?tab=test`);
  await expect(page.getByText(/sends a real WhatsApp message/)).toBeVisible();
  await expect(page.getByText(/mock/i)).toHaveCount(0);

  await page.getByLabel("Phone Number").fill("+628123");
  await page.getByLabel(/^kode/).fill("277353");
  await page.getByRole("button", { name: "Send real test message" }).click();

  // Nothing is sent until the user confirms.
  const dialog = page.getByRole("dialog", { name: "Send a real message?" });
  await expect(dialog.getByText(/goes to \+628123/)).toBeVisible();
  expect(callsTo(api, "POST", `/automation/endpoints/${ENDPOINT_ID}/test`)).toHaveLength(0);
  await dialog.getByRole("button", { name: "Send" }).click();

  await expect(page.getByText('"executionId": "exec_1"')).toBeVisible();
  const sent = callsTo(api, "POST", `/automation/endpoints/${ENDPOINT_ID}/test`);
  expect(sent).toHaveLength(1);
  expect(sent[0].body).toEqual({ to: "+628123", kode: "277353" });
  expect(api.unmatched.map((c) => `${c.method} ${c.path}`)).toEqual([]);
});
