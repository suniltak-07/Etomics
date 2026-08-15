import { test, expect } from "@playwright/test";

/**
 * Lightweight smoke stubs. Skipped automatically when the Next.js
 * dev server is not reachable so CI without e2e stays green.
 */
test.describe("Customer flow (smoke)", () => {
  test.beforeEach(async ({ request }, testInfo) => {
    try {
      await request.get("/", { timeout: 2_000 });
    } catch {
      testInfo.skip(true, "Dev server not running on localhost:3000");
    }
  });

  test("visits home", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
  });

  test("visits plans", async ({ page }) => {
    await page.goto("/plans");
    await expect(page.locator("body")).toBeVisible();
  });

  test("visits login", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("body")).toBeVisible();
  });
});
