import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from e2e/.env
dotenv.config({ path: path.resolve(__dirname, ".env") });

const headed = process.argv.includes("--headed");
const serial = !!process.env.CI || headed;

/**
 * Playwright configuration for Skolist E2E tests.
 *
 * Prerequisites (must be running before `pnpm test`):
 *   1. Supabase:  cd skolist-db && supabase start
 *   2. Backend:   cd backend && uvicorn app:app --port 8080
 *
 * Note: Frontend is started automatically via webServer config below.
 */
export default defineConfig({
  testDir: "./tests",
  /* Run tests in files in parallel (disable in CI / headed so one browser window at a time) */
  fullyParallel: !serial,
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* One worker in CI and headed mode */
  workers: serial ? 1 : undefined,
  /* Reporter to use */
  reporter: process.env.CI ? "github" : "html",
  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: process.env.BASE_URL || "http://localhost:3001",
    /* Collect trace when retrying the failed test */
    trace: "on-first-retry",
    /* Take screenshot on failure */
    screenshot: "only-on-failure",
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // Uncomment to add more browsers:
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  /* Run frontend before starting tests */
  webServer: {
    command: "cd ../frontend/apps/ai_paper_generator && pnpm build && pnpm preview --port 3001",
    url: "http://localhost:3001",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
