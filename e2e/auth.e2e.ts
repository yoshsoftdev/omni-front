import { expect, test, TEST_SESSION } from "./fixtures/api-mock";

test.describe("auth smoke", () => {
  test("login page renders the sign-in form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeEnabled();
  });

  test("unauthenticated dashboard visit redirects to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("failed login shows the backend error and stays on /login", async ({ page, api }) => {
    api.fail("POST", "/auth/login", "invalid email or password", 401);

    await page.goto("/login");
    await page.getByLabel("Email").fill("agent@example.test");
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByText("invalid email or password")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("successful login keeps the API contract and opens the dashboard", async ({ page, api }) => {
    api.ok("POST", "/auth/login", TEST_SESSION);

    await page.goto("/login");
    await page.getByLabel("Email").fill("agent@example.test");
    await page.getByLabel("Password").fill("correct-password");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);

    // Contract lock: login is POST /api/v1/auth/login with {email, password}, no bearer token.
    const login = api.calls.find((c) => c.method === "POST" && c.path === "/auth/login");
    expect(login, "login request was sent").toBeTruthy();
    expect(login!.body).toEqual({ email: "agent@example.test", password: "correct-password" });
    expect(login!.authorization).toBeNull();

    // Every authenticated call after login carries the issued access token.
    const authed = api.calls.filter((c) => c.path !== "/auth/login" && c.path !== "/auth/refresh");
    for (const call of authed) {
      expect(call.authorization, `${call.method} ${call.path}`).toBe(`Bearer ${TEST_SESSION.access_token}`);
    }
  });
});
