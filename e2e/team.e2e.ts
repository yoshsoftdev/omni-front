import { callsTo, expect, mockShell, signIn, test } from "./fixtures/api-mock";

const MEMBER = {
  id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  user_id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  name: "Sari Dewi",
  email: "sari@example.test",
  role: "agent",
  status: "active",
  created_at: new Date(0).toISOString(),
};

// 7.6: invite through the dialog (labelled role select), and removal waits for confirmation.
test("invite a user and remove a member only after confirming", async ({ page, api }) => {
  await signIn(page);
  mockShell(api);
  api.ok("GET", "/teams/users", { users: [MEMBER] });
  api.ok("GET", "/teams/roles", { roles: [] });
  api.ok("GET", "/teams/permissions", { matrix: [] });
  api.ok("POST", "/teams/users/invite", {
    invitation_id: "inv_1",
    invite_url: "https://app.example.test/invite/inv_1",
  });
  api.ok("DELETE", `/teams/users/${MEMBER.id}`, null);

  await page.goto("/team/users");
  await expect(page.getByText("Sari Dewi")).toBeVisible();

  await page.getByRole("button", { name: "Invite User" }).click();
  const invite = page.getByRole("dialog", { name: "Invite User" });
  await invite.getByLabel("Full Name").fill("Budi Santoso");
  await invite.getByLabel("Email").fill("budi@example.test");
  await invite.getByLabel("Role").selectOption("supervisor");
  await invite.getByRole("button", { name: "Send Invitation" }).click();
  await expect(page.getByRole("dialog", { name: "Invitation created successfully" })).toBeVisible();
  expect(callsTo(api, "POST", "/teams/users/invite")[0]?.body).toEqual({
    name: "Budi Santoso",
    email: "budi@example.test",
    role: "supervisor",
  });
  await page.getByRole("button", { name: "Close", exact: true }).first().click();

  await page.getByRole("button", { name: "More actions for Sari Dewi" }).click();
  await page.getByRole("menuitem", { name: "Remove" }).click();
  const confirm = page.getByRole("dialog", { name: "Remove member?" });
  await expect(confirm).toBeVisible();
  expect(callsTo(api, "DELETE", `/teams/users/${MEMBER.id}`)).toHaveLength(0);
  await confirm.getByRole("button", { name: "Remove" }).click();
  await expect(confirm).toBeHidden();
  expect(callsTo(api, "DELETE", `/teams/users/${MEMBER.id}`)).toHaveLength(1);
  expect(api.unmatched.map((c) => `${c.method} ${c.path}`)).toEqual([]);
});
