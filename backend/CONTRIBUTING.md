# Contributing to the backend

Repo-wide rules: [../CONTRIBUTING.md](../CONTRIBUTING.md). Setup: [SETUP.md](./SETUP.md).

## Code style

```bash
cd backend
source venv/bin/activate
ruff check .
ruff format .
pylint .                 # same command CI runs (.github/workflows/pylint.yaml)
# or
pre-commit run --all-files
```

- **Ruff** — lint + format; also via monorepo [`.pre-commit-config.yaml`](../.pre-commit-config.yaml) for `backend/` files.
- **Pylint** — deeper static analysis; config in [`.pylintrc`](./.pylintrc). Required in CI on `backend/**` changes. Fix new warnings before merging.

## Adding API routes

- Prefer feature modules under `api/v1/<feature>/` and include them from the v1 router.
- Keep routes behind existing Supabase auth; do not weaken JWT checks.
- Assessment APIs live under `api/v1/assessment/` and the `assessment` DB schema (see `skolist-db`).
- If the API is running via **Docker Compose**, restart it after route changes (`docker compose restart`). Compose uvicorn has **no `--reload`** — see [SETUP.md](./SETUP.md).

## Tests

```bash
pytest tests/unit -v
pytest tests/integration -v   # needs local Supabase + seeded users + .env
```

Details and markers: [tests/README.md](./tests/README.md).  
Do not hardcode secrets in tests; use env / fixtures.

When changing seed IDs or assessment fixtures, keep them aligned with:

- `skolist-db/python_seeds/data/...`
- `e2e/tests/assessment_api/seed.ts`

## PRs

- Target the team’s integration branch (usually `stage`).
- Mention how you tested (unit / integration / manual curl).
- Avoid unrelated refactors in the same PR.

Longer narrative for interns: [INTERN_GUIDE.md](./INTERN_GUIDE.md).
