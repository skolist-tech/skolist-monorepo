import { test, expect } from "@playwright/test";

/**
 * One headed window only — no app servers.
 * Confirm the browser floats / lands where your WM rules expect.
 */
test("opens a headed browser window", async ({ page }) => {
  await page.setContent(
    "<main style='font-family:system-ui;padding:2rem'><h1>Playwright browser OK</h1><p>Close this window or wait — the test ends in a few seconds.</p></main>"
  );
  await expect(page.getByRole("heading", { name: "Playwright browser OK" })).toBeVisible();
  // Keep the window up briefly so you can check tiling / float rules
  await page.waitForTimeout(4000);
});
