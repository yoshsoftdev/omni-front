import { callsTo, expect, mockShell, signIn, test, TEST_SESSION } from "./fixtures/api-mock";

const CHANNEL = {
  id: "33333333-3333-4333-8333-333333333333",
  team_id: TEST_SESSION.team.id,
  name: "Toko Utama",
  provider: "meta_whatsapp",
  channel_type: "whatsapp",
  status: "connected",
  connection_type: "manual",
  phone_number: "+628110000000",
  waba_id: "1000001",
  phone_number_id: "2000002",
};
const TEMPLATE = {
  id: "88888888-8888-4888-8888-888888888888",
  name: "promo_juni",
  language: "id",
  category: "MARKETING",
  status: "APPROVED",
  components: [{ type: "BODY", text: "Halo {{1}}, ada promo 20% hari ini!" }],
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
};
const TAG = { id: "99999999-9999-4999-8999-999999999999", name: "Pelanggan VIP", color: "#111111", contact_count: 12 };
const CAMPAIGN_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

test("create and send a campaign", async ({ page, api }) => {
  await signIn(page);
  mockShell(api);
  api.ok("GET", "/channels", { items: [CHANNEL] });
  api.ok("GET", "/templates", { items: [TEMPLATE], pagination: { page: 1, page_size: 20, total: 1, total_pages: 1 } });
  api.ok("GET", `/templates/${TEMPLATE.id}`, TEMPLATE);
  api.ok("GET", "/tags", { items: [TAG] });
  const campaign = {
    id: CAMPAIGN_ID,
    name: "Promo Juni",
    status: "draft",
    device_id: CHANNEL.id,
    template_id: TEMPLATE.id,
  };
  api.ok("POST", "/campaigns", campaign, 201);
  api.ok("POST", `/campaigns/${CAMPAIGN_ID}/send`, { ...campaign, status: "running" });
  api.ok("GET", "/campaigns", { items: [{ ...campaign, status: "running" }] });
  api.ok("GET", "/campaigns/reports/overview", {});

  await page.goto("/broadcast/campaigns/create");
  // The wizard footer button; the template list has its own pagination "Next" above it.
  const next = page.getByRole("button", { name: "Next", exact: true }).last();

  await page.getByPlaceholder("e.g. Promo Juni Diskon 20%").fill("Promo Juni");
  await next.click();
  await page.getByText("Toko Utama").first().click();
  await next.click();
  await page.getByText("promo_juni").first().click();
  await next.click();
  await next.click(); // variable mapping (defaults)
  await page.getByLabel(/Pelanggan VIP/).check();
  await next.click();
  await next.click(); // schedule: Send Now (default)
  await page.getByRole("button", { name: /Create & Send/ }).click();

  await expect(page).toHaveURL(/\/broadcast\/campaigns$/);

  // Contract lock: create with channel, template, tags; then send.
  const created = callsTo(api, "POST", "/campaigns");
  expect(created).toHaveLength(1);
  expect(created[0].body).toMatchObject({
    name: "Promo Juni",
    device_id: CHANNEL.id,
    template_id: TEMPLATE.id,
    tag_ids: [TAG.id],
  });
  expect(callsTo(api, "POST", `/campaigns/${CAMPAIGN_ID}/send`)).toHaveLength(1);
  expect(api.unmatched.map((c) => `${c.method} ${c.path}`)).toEqual([]);
});
