import { test, expect } from "@playwright/test";

/**
 * Lightweight admin smoke stubs. Skipped when the server is down.
 */
test.describe("Admin flow (smoke)", () => {
  test.beforeEach(async ({ request }, testInfo) => {
    try {
      await request.get("/login", { timeout: 2_000 });
    } catch {
      testInfo.skip(true, "Dev server not running on localhost:3000");
    }
  });

  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("body")).toBeVisible();
  });
});
