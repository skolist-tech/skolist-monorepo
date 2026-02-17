import { test, expect } from "@playwright/test";

/**
 * Smoke test: Visit the AI Paper Generator (qgen) homepage.
 *
 * This test simply verifies that:
 *   1. The frontend dev server is running and reachable.
 *   2. The page loads without crashing.
 *
 * Prerequisites:
 *   - Frontend dev server running on BASE_URL (default: http://localhost:3001)
 */
test.describe("Smoke Tests", () => {
  test("should load the qgen homepage", async ({ page }) => {
    // Navigate to the root URL (BASE_URL from playwright.config.ts)
    await page.goto("/");

    // The page should have loaded (not a blank error page)
    // We check for any visible content. Adjust the selector
    // once you know what the login/dashboard page shows.
    await expect(page).toHaveTitle(/.*/);

    // Verify the page is not showing an error
    // (e.g., "Cannot GET /" or a blank white screen)
    const body = page.locator("body");
    await expect(body).not.toBeEmpty();
  });

  test("should redirect unauthenticated users to /login", async ({ page }) => {
    // Try to access the protected root route
    await page.goto("/");

    // Since we're not logged in, ProtectedRoute should redirect to /login
    await page.waitForURL("**/login**");
    await expect(page).toHaveURL(/\/login/);
  });
});
