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
npm run test:assessments:headed   # assessments, headed, 1 worker
npm run test:ui                   # Playwright UI
npm run codegen                   # record selectors
```

Run a single file:

```bash
npx playwright test --project=assessments tests/assessment_api/teacher.spec.ts
npx playwright test --project=qgen tests/login.spec.ts
```

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
- Assessment specs assert against **seeded** papers (JEE / NEET titles and UUIDs in `assessment_api/seed.ts`). Re-seed if local data drifts.
- HTML report: `npx playwright show-report` after a run (or open `playwright-report/`).
