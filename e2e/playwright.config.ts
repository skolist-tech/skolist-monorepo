import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from e2e/.env
dotenv.config({ path: path.resolve(__dirname, ".env") });

const headed = process.argv.includes("--headed");
const serial = !!process.env.CI || headed;

const QGEN_URL = process.env.BASE_URL || "http://localhost:3001";
const ASSESSMENTS_URL =
  process.env.ASSESSMENTS_BASE_URL || "http://localhost:3003";

/**
 * Playwright configuration for Skolist E2E tests.
 *
 * Prerequisites (must be running before tests):
 *   1. Supabase:  cd skolist-db && supabase start
 *   2. Backend:   docker compose / uvicorn on :8080
 *   3. Assessment seeds loaded (python seed scripts on assessment_api)
 *
 * Frontends are started automatically via webServer (or reused if already up).
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: !serial,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: serial ? 1 : undefined,
  reporter: process.env.CI ? "github" : "html",

  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "qgen",
      testMatch: /(?:^|\/)(smoke|login)\.spec\.ts$/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: QGEN_URL,
      },
    },
    {
      name: "assessments",
      testMatch: /assessment_api\/.*\.spec\.ts$/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: ASSESSMENTS_URL,
      },
    },
  ],

  webServer: [
    {
      command:
        "cd ../frontend/apps/ai_paper_generator && pnpm build && pnpm preview --port 3001",
      url: QGEN_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
    {
      command:
        "cd ../frontend/apps/assessments && pnpm build && pnpm preview --port 3003",
      url: ASSESSMENTS_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
  ],
});
