# Agent instructions

This file applies to **every** task in this monorepo.

## Before changing code or committing

1. Read the root **[README.md](./README.md)**.
2. Follow every doc it links that is relevant to the area you will touch (for example `SETUP.md`, `CONTRIBUTING.md`, and the package `README` / `SETUP` / `CONTRIBUTING` under `backend/`, `frontend/`, `skolist-db/`, or `e2e/`).
3. Prefer those docs over guessing commands, env vars, seed data, branch rules, or test layout.
4. Do **not** edit the codebase or create a commit until that reading is done for the packages in scope.
5. **Before any commit:** run the mandatory checks in [CONTRIBUTING.md — Before committing](./CONTRIBUTING.md#before-committing-mandatory) for every package you touched. Do not commit on type-check-only or “seeded OK” when lint/tests/e2e apply.

## GitHub

Use the **`gh` CLI** for all GitHub work in this repo: issues, pull requests, checks, releases, branch/PR inspection, and reviewing CI failures. Prefer `gh` over the GitHub website or inventing raw `curl`/`api.github.com` calls.

## Before saying the task is done

**Strict:** do **not** tell the user a task is done, complete, finished, or ready until you have **actually run** the relevant tests / quality checks for the packages you changed (see [CONTRIBUTING.md](./CONTRIBUTING.md) quality bar).

- Running only `tsc` / a seed script / a static file count is **not** “tested” when lint, unit, integration, or e2e apply to that change.
- If you cannot run a required check (missing services, env, etc.), say so explicitly and list what was **not** run — never imply full verification.
- Prefer reporting failures and fixing them over declaring done.

## After you finish

If the work reveals missing or wrong docs, update the relevant README / SETUP / CONTRIBUTING (or note it for the human), per [CONTRIBUTING.md](./CONTRIBUTING.md).


## User Side Tips

- If the user says you something related to changed in codebase, and you haven't done them, then without doing any further change just report that to the user.
