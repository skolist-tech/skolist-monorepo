# E2E tests (Playwright)

Browser end-to-end tests for Skolist. Specs live under `tests/`; Playwright starts the frontends (or reuses ones already running).

## Docs

| Doc | Purpose |
| --- | --- |
| [TESTING.md](./TESTING.md) | What this suite needs, and the specs in each folder |
| [TESTS.md](./TESTS.md) | Flat list of the same specs |
| [../TESTING.md](../TESTING.md) | Repo test map (unit, integration, e2e) |

Monorepo docs: [../README.md](../README.md) · [../SETUP.md](../SETUP.md) · [../CONTRIBUTING.md](../CONTRIBUTING.md) · [../TESTING.md](../TESTING.md)  
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
   Compose **does not** hot-reload Python. If you added or changed API routes, `docker compose restart` in `backend/` first or e2e will hit **404** on the old process. Host `uvicorn --reload` does not need that. See [backend/SETUP.md](../backend/SETUP.md).


Playwright will **build + preview** qgen (`3001`) and assessments (`3003`) automatically. If those servers are already up, they are reused (outside CI).

The Cursor IDE browser tab often cannot open local apps (`localhost` / `127.0.0.1`). Use these Playwright commands (or `curl`) to verify UI — do not treat a blank IDE-browser tab as the app being down.

## Setup

```bash
cd e2e
npm install
npx playwright install chromium   # first time / after Playwright upgrades
cp .env.example .env              # optional overrides
```

`@playwright/test` is pinned to the same release as the backend `playwright` package in `backend/pyproject.toml` and the image tag in `backend/Dockerfile` (`mcr.microsoft.com/playwright/python:v<version>-noble`). Change those three together. Both tools install browsers into `~/.cache/ms-playwright`, so one `playwright install chromium` covers e2e and the backend only while the versions match.

Defaults match local seeds; `.env` is only needed if you change URLs or credentials.

## Commands

From `e2e/`:

```bash
npm test                          # all projects
npm run test:qgen                 # qgen only
npm run test:assessments          # assessments only (1 worker — shared seed users)
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
npx playwright test --project=assessments tests/assessment_api/teachers/teacher.spec.ts
npx playwright test --project=qgen tests/login.spec.ts
```

`npm run test:browser` uses `playwright.browser-check.config.ts` — it does **not** start qgen/assessments. Use it to confirm the browser opens and your window manager rules (float / workspace) apply.

## Shared-state note

Assessment specs can mutate attempt state (`Start`, `Continue`, submit, mark-for-review). Prefer:

- different seeded students for different workflow specs, and
- `--workers=1` when a run intentionally exercises the same student / same test end-to-end.

`npm run test:assessments` already uses **one worker**. Parallel logins as the same seed teacher/student can invalidate the other's JWT (`Invalid or expired token`).

Playwright does not provide a clean general-purpose "run test B only if test A passed" feature inside one spec file the way a build graph would. Project-level dependencies / global setup exist, but for product e2e the better pattern is usually **independent tests + isolated seed state**, not test-on-test dependencies.

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

What each file is for: **[TESTS.md](./TESTS.md)**.

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
      auth.spec.ts            # shared (teacher + student)
      teachers/
        teacher.spec.ts
        workflow.spec.ts
        author-and-publish.spec.ts
      students/
        student.spec.ts
        workflow.spec.ts
        attempt-authored-paper.spec.ts
        unreleased-paper.spec.ts
        jee-main-complete-attempt.spec.ts
```

## Notes

- Headed mode forces **one worker** so a single browser window runs at a time.
- Video is off unless `E2E_VIDEO=1` (see `test:*:video` scripts); files land in `videos/<timestamp>/` and previous runs are kept.
- Distinct frames are off unless `E2E_IMAGES=1` (needs ffmpeg); JPEGs land in `videos/<timestamp>/<test-folder>/images/`.
- Assessment specs assert against **seeded** papers (JEE / NEET titles and UUIDs in `assessment_api/seed.ts`). Re-seed if local data drifts.
- HTML report: `npx playwright show-report` after a run (or open `playwright-report/`).
