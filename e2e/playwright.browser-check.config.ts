import { defineConfig, devices } from "@playwright/test";

/**
 * Minimal headed config: open one Chromium window, no webServer / app stack.
 * Use to verify Hyprland (or any WM) floats/places the Playwright browser correctly.
 *
 *   npm run test:browser
 */
export default defineConfig({
  testDir: "./tests",
  testMatch: /browser-check\.spec\.ts$/,
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    headless: false,
    viewport: { width: 1280, height: 800 },
  },
});
