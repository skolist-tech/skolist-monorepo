import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from e2e/.env
dotenv.config({ path: path.resolve(__dirname, ".env") });

const headed = process.argv.includes("--headed");
const serial = !!process.env.CI || headed;
/**
 * Opt-in video via `E2E_VIDEO=1` (Playwright has no `--video` CLI flag).
 * npm scripts: `test:headed:video`, `test:assessments:headed:video`.
 */
function envOn(name: string) {
  return ["1", "true", "yes"].includes(
    (process.env[name] ?? "").toLowerCase()
  );
}

const extractFrames = envOn("E2E_IMAGES");
/** Frame dumps need a recording; E2E_IMAGES=1 turns video on as well. */
const recordVideo = envOn("E2E_VIDEO") || extractFrames;

/**
 * Playwright empties `outputDir` at the start of every run. Use a new
 * timestamped folder under videos/ so earlier recordings are kept.
 */
function videoRunOutputDir() {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return path.resolve(__dirname, "videos", stamp);
}

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
 *
 * Video: set `E2E_VIDEO=1`. Each run writes to `e2e/videos/<timestamp>/`
 * (gitignored). Previous timestamp folders are not deleted.
 * Frames: set `E2E_IMAGES=1` (implies video). Distinct JPEGs go in each
 * test folder's `images/` (needs ffmpeg).
 */
export default defineConfig({
  testDir: "./tests",
  ...(recordVideo ? { outputDir: videoRunOutputDir() } : {}),
  fullyParallel: !serial,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: serial ? 1 : undefined,
  reporter: extractFrames
    ? [
        ["list"],
        [process.env.CI ? "github" : "html"],
        ["./reporters/extract-video-frames.ts"],
      ]
    : process.env.CI
      ? "github"
      : "html",

  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    ...(recordVideo ? { video: "on" as const } : {}),
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
