# Testing

How tests are split in this repo, what each layer needs, and what to add when you change behaviour.

Folder inventories (the tests that exist today):

| Folder | What it covers |
| --- | --- |
| [backend/](./backend/TESTING.md) | Pytest: unit and integration |
| [backend/tests/unit/](./backend/tests/unit/TESTING.md) | Python-only unit tests |
| [backend/tests/integration/](./backend/tests/integration/TESTING.md) | API tests against local Supabase |
| [e2e/](./e2e/TESTING.md) | Playwright browser tests |
| [e2e/tests/](./e2e/tests/TESTING.md) | Specs at the e2e tests root |
| [e2e/tests/assessment_api/](./e2e/tests/assessment_api/TESTING.md) | Shared assessment browser specs |

How to run a suite: [backend/tests/README.md](./backend/tests/README.md) and [e2e/README.md](./e2e/README.md).

## Layers

### Backend unit tests

Python only. They mock Supabase, LLMs, browsers, and other I/O. They do not need a database, a running API, or a frontend. CI runs them in [`.github/workflows/pytest-unit.yaml`](./.github/workflows/pytest-unit.yaml) with no Supabase service.

```bash
cd backend && source venv/bin/activate
pytest tests/unit
```

Inventory: [backend/tests/unit/TESTING.md](./backend/tests/unit/TESTING.md).

### Backend integration tests

Supabase plus the backend Python code. They call the FastAPI app (or a Postgres RPC) against a local Supabase database and the Python seeds. They do not open a frontend. The API process still launches Chromium, so install the browser for the Playwright version shared by `backend/pyproject.toml` and `e2e/package.json` ([backend/SETUP.md](./backend/SETUP.md)). CI starts Supabase in [`.github/workflows/pytest-integration.yaml`](./.github/workflows/pytest-integration.yaml).

```bash
cd backend && source venv/bin/activate
pytest tests/integration
```

Inventory: [backend/tests/integration/TESTING.md](./backend/tests/integration/TESTING.md).

### E2E tests

Playwright. You start **Supabase** and the **backend** yourself. Playwright then builds and launches the frontend (or reuses one already on the port) and drives it in a browser. CI is [`.github/workflows/e2e.yaml`](./.github/workflows/e2e.yaml).

```bash
cd e2e
npm run test:assessments   # or test:qgen / npm test
```

Inventory: [e2e/TESTING.md](./e2e/TESTING.md).

### Packages without their own suite

- **frontend/** — no app test runner. Behaviour a person can see or click is covered by [e2e/](./e2e/TESTING.md). `pnpm lint` and `pnpm type-check` are static checks, not tests.
- **skolist-db/** — no test runner. Migrations and seeds are exercised by backend integration tests and by e2e.

## Test creation guidelines

- **Write a unit test for every backend component you add.** Routes helpers, serializers, graders, prompt builders, and other Python logic belong in `backend/tests/unit/`. Stub configuration and external clients. A unit test must pass with no database and no frontend. Do not read live `SUPABASE_URL` / service keys; patch them when the code checks that they are set.
- **Write an integration test when the code must hit Supabase or a real HTTP route.** Put it in `backend/tests/integration/`. Keep seed IDs aligned with `skolist-db/python_seeds/` and `e2e/tests/assessment_api/seed.ts`.
- **Write an e2e test for every user-experienceable action** — a small control, a larger flow, or a complete journey. If a person can see it or do it in the app, add a Playwright spec under `e2e/tests/` that performs that action. Reuse seeded users. Do not share one seed login across parallel workers.
