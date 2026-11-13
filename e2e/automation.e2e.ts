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
