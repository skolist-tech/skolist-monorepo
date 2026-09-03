# Contributing to skolist-db

Repo-wide rules: [../CONTRIBUTING.md](../CONTRIBUTING.md). Setup: [SETUP.md](./SETUP.md).

## Migrations vs seeds

| Kind | Where | When |
| --- | --- | --- |
| Schema / policy changes | `supabase/migrations/` | New timestamped SQL file; do not rewrite already-applied migrations on shared branches |
| Static SQL fixtures | `supabase/seeds/` | Data loaded on `supabase db reset` |
| Auth users + rich domains | `python_seeds/` | After reset via `seed.py` |

## Conventions

- Prefer **additive** migrations.
- Keep seed UUIDs / emails **stable** once referenced by backend tests or `e2e/tests/assessment_api/seed.ts`.
- Define orgs/users once in `python_seeds/data/` and import them elsewhere — avoid duplicated credentials.
- Do not commit local `.env`, service keys, or `__pycache__` / `venv/`.

## Validation

After a migration or seed change:

1. `supabase db reset` (or migrate) on a clean local project.
2. `python seed.py` (or the scripts you changed).
3. Smoke the dependent package (backend integration tests and/or `e2e` assessment project).

## PRs

Call out breaking seed ID changes explicitly — they break fixtures and Playwright specs.
