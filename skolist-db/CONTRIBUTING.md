# Contributing to skolist-db

Repo-wide rules: [../CONTRIBUTING.md](../CONTRIBUTING.md). Setup: [SETUP.md](./SETUP.md).

## Migrations vs seeds

| Kind | Where | When |
| --- | --- | --- |
| Schema / policy changes | `supabase/migrations/` | New timestamped SQL file; do not rewrite already-applied migrations on shared branches |
| Static SQL fixtures | `supabase/seeds/` | Data loaded on `supabase db reset` |
| Auth users + rich domains | `python_seeds/` | After reset via `seed.py` |

## How migrations are applied

**Never apply a migration by hand** — not on local, not on staging, not on production. That includes the Supabase SQL editor, MCP `apply_migration` / `execute_sql` DDL, `supabase db push` from a laptop, and dashboard “run SQL”.

| Environment | Who applies `supabase/migrations/` |
| --- | --- |
| Local | `cd skolist-db && supabase migration up --local` only |
| Staging | GitHub Action [`.github/workflows/db-push-stage.yaml`](../.github/workflows/db-push-stage.yaml) (`supabase db push` on push to `stage`) |
| Production | GitHub Action [`.github/workflows/db-push-main.yaml`](../.github/workflows/db-push-main.yaml) (`supabase db push` on push to `main`) |

Write a new timestamped file under `supabase/migrations/`, merge it, and let those paths apply it. If you apply SQL out of band, the remote history version will not match the filename and CI `db push` will fail with “Remote migration versions not found in local migrations directory.”

`supabase db reset` (local only) is a full wipe-and-rebuild, not a way to ship one new migration. Do not `db reset --linked` against a shared cloud project.

## Conventions

- Prefer **additive** migrations.
- Prefer **idempotent** migrations so they can be re-applied without error (`IF NOT EXISTS`, `CREATE OR REPLACE`, `DROP … IF EXISTS`, guarded `DO` blocks). If the whole file is idempotent, put `--IDEMPOTENT` as the first line. Do not add that marker unless every statement can run twice safely.
- Keep seed UUIDs / emails **stable** once referenced by backend tests or `e2e/tests/assessment_api/seed.ts`.
- Define orgs/users once in `python_seeds/data/` and import them elsewhere — avoid duplicated credentials.
- Python seed runners live as `python_seeds/_…_seed_….py` (auto-discovered by `seed.py`).
- Do not commit local `.env`, service keys, or `__pycache__` / `venv/`.

## Local custom data (scratch seeds)

If you want to **test on custom data** without changing committed seeds, write a local seeding script:

1. Add `python_seeds/_local_seed_<name>.py` (must start with `_` and contain `_seed_`).
2. Expose a callable named after the file (e.g. `seed_my_scenario` for `_local_seed_my_scenario.py`), or `main` / `seed`.
3. Run `python seed.py` — it auto-discovers and runs after the numbered seeds (name sort).

These files are **gitignored** (`python_seeds/_local_seed_*.py`). Do not commit them; keep shared fixtures in the numbered `_NNN_seed_*.py` / `data/` modules instead.

## Validation

After a migration or seed change:

1. `supabase db reset` (or migrate) on a clean local project.
2. `python seed.py` (or the scripts you changed).
3. Smoke the dependent package (backend integration tests and/or `e2e` assessment project).

## PRs

Call out breaking seed ID changes explicitly — they break fixtures and Playwright specs.
