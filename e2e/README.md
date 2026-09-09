# E2E tests (Playwright)

Browser end-to-end tests for Skolist. Specs live under `tests/`; Playwright starts the frontends (or reuses ones already running).

Monorepo docs: [../README.md](../README.md) · [../SETUP.md](../SETUP.md) · [../CONTRIBUTING.md](../CONTRIBUTING.md)  
Stack setup: [../skolist-db/SETUP.md](../skolist-db/SETUP.md) · [../backend/SETUP.md](../backend/SETUP.md) · [../frontend/SETUP.md](../frontend/SETUP.md)

## Projects

| Project | App | Port | Specs |
| --- | --- | --- | --- |
| `qgen` | AI Paper Generator | `3001` | `tests/smoke.spec.ts`, `tests/login.spec.ts` |
| `assessments` | Assessments | `3003` | `tests/assessment_api/**/*.spec.ts` |

## Prerequisites

Start these yourself before running tests:

1. **Supabase** (local)

   ```bash
   cd skolist-db && supabase start
   ```

2. **Backend** on `:8080`  
   From `backend/`, e.g. `docker compose up` or uvicorn.  


Playwright will **build + preview** qgen (`3001`) and assessments (`3003`) automatically. If those servers are already up, they are reused (outside CI).

## Setup

```bash
cd e2e
npm install
npx playwright install chromium   # first time / after Playwright upgrades
cp .env.example .env              # optional overrides
```

Defaults match local seeds; `.env` is only needed if you change URLs or credentials.

## Commands

From `e2e/`:

```bash
npm test                          # all projects
npm run test:qgen                 # qgen only
npm run test:assessments          # assessments only
npm run test:headed               # all, headed, 1 worker
npm run test:headed:video         # headed + record videos → videos/
npm run test:headed:video:images  # video + distinct JPEG frames (ffmpeg)
npm run test:assessments:headed   # assessments, headed, 1 worker
npm run test:assessments:headed:video
npm run test:assessments:headed:video:images
npm run test:browser              # one headed Chromium window only (no app servers; WM / Hyprland check)
npm run test:ui                   # Playwright UI
npm run codegen                   # record selectors
```

Run a single file:

```bash
npx playwright test --project=assessments tests/assessment_api/teacher.spec.ts
npx playwright test --project=qgen tests/login.spec.ts
```

`npm run test:browser` uses `playwright.browser-check.config.ts` — it does **not** start qgen/assessments. Use it to confirm the browser opens and your window manager rules (float / workspace) apply.

### Video recording

Opt-in only (off by default). Playwright has no `--video` CLI flag, so we use `E2E_VIDEO=1`:

```bash
# npm scripts (headed + video)
npm run test:headed:video
npm run test:assessments:headed:video

# or set the env yourself
E2E_VIDEO=1 npx playwright test --headed --project=assessments
```

Recordings go to `e2e/videos/` (gitignored). Playwright **clears its output directory** at the start of a run, so each invocation uses a **new timestamp folder** (`e2e/videos/2026-09-03T19-19-12-345Z/…`). Older folders are left in place. Inside a run, each test still gets `video.webm` under a folder named after the spec.

### Distinct frames (for agent / screenshot review)

Agents cannot watch `.webm`. Opt in so ffmpeg writes a sequence of **distinct** JPEGs (near-duplicates dropped) next to the video:

```bash
# needs ffmpeg on PATH
npm run test:headed:video:images
npm run test:assessments:headed:video:images

E2E_IMAGES=1 npx playwright test --headed --project=assessments
```

`E2E_IMAGES=1` also turns video on. Output: `e2e/videos/<timestamp>/<test-folder>/images/frame_001.jpg`, …

## Layout

```
e2e/
  playwright.config.ts
  tests/
    helpers/auth.ts           # shared login helpers
    smoke.spec.ts
    login.spec.ts
    assessment_api/
      seed.ts                 # seed emails / test names / IDs
      helpers.ts
      auth.spec.ts
      teacher.spec.ts
      student.spec.ts
```

## Notes

- Headed mode forces **one worker** so a single browser window runs at a time.
- Video is off unless `E2E_VIDEO=1` (see `test:*:video` scripts); files land in `videos/<timestamp>/` and previous runs are kept.
- Distinct frames are off unless `E2E_IMAGES=1` (needs ffmpeg); JPEGs land in `videos/<timestamp>/<test-folder>/images/`.
- Assessment specs assert against **seeded** papers (JEE / NEET titles and UUIDs in `assessment_api/seed.ts`). Re-seed if local data drifts.
- HTML report: `npx playwright show-report` after a run (or open `playwright-report/`).
