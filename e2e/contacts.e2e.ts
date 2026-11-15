import { callsTo, expect, mockShell, signIn, test, TEST_SESSION } from "./fixtures/api-mock";

const TAG = { id: "99999999-9999-4999-8999-999999999999", name: "Pelanggan VIP", color: "#111111", contact_count: 0 };

const contact = (id: string, name: string, phone: string) => ({
  id,
  team_id: TEST_SESSION.team.id,
  contact_name: name,
  customer_name: name,
  phone,
  source: "manual",
  marketing_status: "unknown",
  tags: [],
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
});
const BUDI = contact("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1", "Budi Santoso", "+628120000001");
const SARI = contact("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2", "Sari Dewi", "+628120000002");

function mockContacts(api: Parameters<typeof mockShell>[0], listUrls: string[]) {
  mockShell(api);
  api.on("GET", "/contacts", async (route, request) => {
    listUrls.push(request.url());
    await route.fulfill({
      json: { success: true, data: { items: [BUDI, SARI], pagination: { page: 1, page_size: 10, total: 2, total_pages: 1 } } },
    });
  });
  api.ok("GET", "/tags", { items: [TAG] });
  api.ok("GET", "/contacts/stats", { total: 2, opt_in: 0, opt_out: 0, unknown: 2 });
  api.ok("GET", "/contacts/field-definitions", { items: [] });
}

// 7.3: filters run on the server, and a bulk action tags every selected contact.
test("contacts filter on the server and bulk-tag the selection", async ({ page, api }) => {
  const listUrls: string[] = [];
  await signIn(page);
  mockContacts(api, listUrls);
  for (const c of [BUDI, SARI]) {
    api.on("PATCH", `/contacts/${c.id}`, (route) =>
      route.fulfill({ json: { success: true, data: { ...c, tags: [TAG] } } }),
    );
  }

  await page.goto("/contacts");
  await expect(page.getByLabel("Select Sari Dewi")).toBeVisible();

  await page.getByLabel("Source").selectOption("import");
  await expect.poll(() => listUrls.some((u) => new URL(u).searchParams.get("source") === "import")).toBe(true);

  await page.getByLabel("Select all contacts on this page").check();
  const toolbar = page.getByRole("toolbar", { name: "Bulk actions" });
  await expect(toolbar.getByText("2 selected")).toBeVisible();
  await toolbar.getByLabel("Tag to add").selectOption(TAG.id);
  await toolbar.getByRole("button", { name: "Apply tag" }).click();
  await expect(page.getByText('Tagged "Pelanggan VIP" on 2 contacts')).toBeVisible();

  for (const c of [BUDI, SARI]) {
    const patches = callsTo(api, "PATCH", `/contacts/${c.id}`);
    expect(patches).toHaveLength(1);
    expect(patches[0].body).toMatchObject({ tag_ids: [TAG.id] });
  }
  expect(api.unmatched.map((c) => `${c.method} ${c.path}`)).toEqual([]);
});

// 7.3: import sends the column mapping and reports skipped rows by file line.
test("import a CSV with mapped columns and see the row report", async ({ page, api }) => {
  await signIn(page);
  mockShell(api);
  api.ok("POST", "/contacts/import/csv", {
    created: 1,
    updated: 0,
    skipped: 1,
    errors: [{ line: 3, message: "phone is required" }],
  });

  await page.goto("/contacts/import");
  await page.getByLabel("Contacts file").setInputFiles({
    name: "kontak.csv",
    mimeType: "text/csv",
    buffer: Buffer.from('Nama Lengkap,No WA,Catatan\nBudi,+628111,"vip, lama"\nTanpa Nomor,,\n'),
  });
  await page.getByRole("button", { name: "Continue" }).click();

  // "Nama Lengkap" and "No WA" are not known header names, so map them by hand.
  await page.getByLabel("Field for column Nama Lengkap").selectOption("name");
  await expect(page.getByText("Map one column to Phone Number to continue.")).toBeVisible();
  await page.getByLabel("Field for column No WA").selectOption("phone");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByText("First 2 of 2 rows")).toBeVisible();
  await page.getByRole("button", { name: "Start Import" }).click();

  const report = page.getByRole("region", { name: "Import result" });
  await expect(report.getByText("phone is required")).toBeVisible();
  await expect(report.getByRole("cell", { name: "3", exact: true })).toBeVisible();

  const uploads = callsTo(api, "POST", "/contacts/import/csv");
  expect(uploads).toHaveLength(1);
  const body = String(uploads[0].body);
  expect(body).toContain('name="mapping"');
  expect(body).toContain('{"Nama Lengkap":"name","No WA":"phone","Catatan":""}');
  expect(api.unmatched.map((c) => `${c.method} ${c.path}`)).toEqual([]);
});
