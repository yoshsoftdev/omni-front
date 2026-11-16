import { AGENT_PERMISSIONS, callsTo, expect, mockShell, signIn, test } from "./fixtures/api-mock";

// 9.2: welcome message and keyword replies are configured from Settings → Auto Reply.
test("configure the welcome message and a keyword reply", async ({ page, api }) => {
  await signIn(page);
  mockShell(api);
  api.ok("GET", "/inbox/settings/welcome", { enabled: false, text: "" });
  api.on("PUT", "/inbox/settings/welcome", async (route, request) => {
    await route.fulfill({ json: { success: true, data: JSON.parse(request.postData() ?? "{}") } });
  });
  api.ok("GET", "/inbox/keyword-rules", { items: [] });
  api.on("POST", "/inbox/keyword-rules", async (route, request) => {
    const body = JSON.parse(request.postData() ?? "{}");
    await route.fulfill({
      status: 201,
      json: { success: true, data: { ...body, id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd", created_at: "", updated_at: "" } },
    });
  });

  await page.goto("/settings/auto-reply");
  await expect(page.getByText("No keyword replies yet.")).toBeVisible();

  // Turning it on without text is refused before any request.
  await page.getByLabel("Enabled").first().check();
  await page.getByRole("button", { name: "Save welcome message" }).click();
  await expect(page.getByText("Write the welcome message before turning it on")).toBeVisible();
  expect(callsTo(api, "PUT", "/inbox/settings/welcome")).toHaveLength(0);

  await page.getByLabel("Message", { exact: true }).fill("Halo! Tim kami segera membalas.");
  await page.getByRole("button", { name: "Save welcome message" }).click();
  await expect(page.getByText("Welcome message saved")).toBeVisible();
  expect(callsTo(api, "PUT", "/inbox/settings/welcome")[0].body).toEqual({
    enabled: true,
    text: "Halo! Tim kami segera membalas.",
  });

  await page.getByRole("button", { name: "Add keyword reply" }).click();
  const dialog = page.getByRole("dialog", { name: "Add keyword reply" });
  await dialog.getByLabel("Keywords").fill("harga, price list,");
  await dialog.getByLabel("Reply").fill("Daftar harga ada di katalog kami.");
  await dialog.getByRole("button", { name: "Save" }).click();

  await expect(page.getByRole("cell", { name: "harga, price list" })).toBeVisible();
  expect(callsTo(api, "POST", "/inbox/keyword-rules")[0].body).toEqual({
    keywords: ["harga", "price list"],
    match_type: "contains",
    reply_text: "Daftar harga ada di katalog kami.",
    enabled: true,
    sort_order: 1,
  });
  expect(api.unmatched.map((c) => `${c.method} ${c.path}`)).toEqual([]);
});

test("an agent sees auto replies read-only", async ({ page, api }) => {
  await signIn(page, "agent");
  mockShell(api, AGENT_PERMISSIONS);
  api.ok("GET", "/inbox/settings/welcome", { enabled: true, text: "Halo!" });
  api.ok("GET", "/inbox/keyword-rules", {
    items: [{ id: "r1", keywords: ["harga"], match_type: "contains", reply_text: "x", enabled: true, sort_order: 1, created_at: "", updated_at: "" }],
  });

  await page.goto("/settings/auto-reply");
  await expect(page.getByRole("cell", { name: "harga" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add keyword reply" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Save welcome message" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Edit keyword reply/ })).toHaveCount(0);
});
