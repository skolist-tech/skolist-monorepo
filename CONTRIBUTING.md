# Contributing (monorepo)

Thanks for contributing. This file is the **repo-wide** workflow. Language- and package-specific rules live next to the code.

## Package guides

| Area | Contributing guide |
| --- | --- |
| Backend (Python / FastAPI) | [backend/CONTRIBUTING.md](./backend/CONTRIBUTING.md) |
| Frontend (TypeScript / React) | [frontend/CONTRIBUTING.md](./frontend/CONTRIBUTING.md) |
| Database (Supabase) | [skolist-db/CONTRIBUTING.md](./skolist-db/CONTRIBUTING.md) |

Intern-oriented walkthroughs (optional, more narrative):

- [backend/INTERN_GUIDE.md](./backend/INTERN_GUIDE.md)
- [frontend/INTERN_GUIDE.md](./frontend/INTERN_GUIDE.md)

## Python virtualenvs

Never use system / raw `python` (or `python3`) for this repo. Each Python package has its own venv — activate that one before running anything.

| Work | Venv | Activate |
| --- | --- | --- |
| Anything **skolist-db** related (seeds, `seed.py`, `unseed.py`, seed scripts) | `skolist-db/venv` | `cd skolist-db && source venv/bin/activate` |
| Anything **backend** related (API, pytest, ruff, pylint, uvicorn) | `backend/venv` | `cd backend && source venv/bin/activate` |

Do not mix them: do not run seeds with `backend/venv`, and do not run the API or backend tests with `skolist-db/venv`. If the venv is missing, create it from that package’s [SETUP.md](./SETUP.md) (`python -m venv venv` is only for creating the venv, then use `venv/bin/python` / activate from then on).

## Branches

Work from an up-to-date `stage` (or the branch your team designates), never commit directly to `main` / `stage` unless you own releases.

| Prefix | Use |
| --- | --- |
| `feature/<short-name>` | New behaviour |
| `bugs/<short-name>` | Bug fixes |
| `chore/<short-name>` | Tooling, docs, CI |

Examples: `feature/assessment-login-e2e`, `bugs/fix-navbar-overflow`, `chore/setup-docs`.

## Git

When renaming or moving a tracked file, always use `git mv`. Never use plain `mv` (or a filesystem rename) in this monorepo — Git then treats the change as a delete plus an add and you lose the rename.

### Commit messages

Structure the commit message so **each change in that commit** gets its own line:

```
change: one-liner description
change: one-liner description
```

Example:

```
feat(skolist-db): auto-discover _*_seed_*.py scripts
docs: document local _local_seed_*.py scratch seeds
```

You may add notes, context, or a longer body after this block if needed, but the **one line per change** list is the important part and should always be present.

### Before committing (mandatory)

**Do not commit until you have run the tests / checks for every package your change touches.** Type-check alone, “it seeded”, or “it compiles” is not enough when that package has a defined test / quality bar below.

| Touched | Must run before commit |
| --- | --- |
| `backend/` | `ruff check .`, `ruff format --check .`, `pylint .`, `pytest tests/unit` (+ integration when DB-related) — from `backend/venv` |
| `frontend/` | `pnpm lint`, `pnpm type-check` |
| `skolist-db/` | Apply / validate migrations as needed; smoke seed path from `skolist-db/venv` when seeds change; keep IDs in sync with backend/e2e |
| `e2e/` or behaviour covered by Playwright | Relevant `npm run test:…` project(s) |

If a check fails, **fix it and create a new commit** only after green (or update the PR description with an explicit waiver only when the team agrees). Skipping these because the change “looks fine” is not allowed.

Full commands: [Quality bar (by area)](#quality-bar-by-area).

## Pull requests

1. Keep PRs focused (one concern per PR when practical).
2. Describe **why** and how to test (checklist welcome).
3. Ensure package checks pass (see below) before requesting review — same bar as **Before committing**.
4. Do not commit secrets (`.env`, service keys, Firebase JSON, etc.).

## Improve the docs as you go

While contributing, if you notice anything that would have made the work easier or faster — missing steps, better logging, outdated commands, unclear SETUP/CONTRIBUTING/README sections, a missing or outdated agent skill, or useful tips that only lived in someone's head — **report it**.

- Prefer a short note in the PR description (or a follow-up docs PR / issue).
- Point at the file that should change when you can (`SETUP.md`, package guides, e2e README, `.cursor/skills/`, etc.).
- Small doc fixes in the same PR are welcome when they are clearly related; larger doc rewrites can be a separate `chore/` PR.

Good docs compound: leave the next person (including future you) better off than you found them.

## Agent guidance (Cursor)

- Always-on agent instructions: **[AGENTS.md](./AGENTS.md)** (read the README hub before changing code or committing).
- Project skills live under **[`.cursor/skills/`](./.cursor/skills/)** (each skill is a folder with `SKILL.md`).
- Current skills:
  - [`create-video-for-workflow`](./.cursor/skills/create-video-for-workflow/SKILL.md) — when asked for a video of a workflow, write a temporary e2e test, run it with `E2E_VIDEO=1` and `E2E_IMAGES=1`, point at `e2e/videos/<timestamp>/` (older runs are kept) and `images/`, and remind the user to delete the test if it should not stay in the suite.

## Quality bar (by area)

Run the checks for the packages you touched:

**Backend**

```bash
cd backend
source venv/bin/activate
ruff check .
ruff format --check .
pylint .
pytest tests/unit   # + integration when DB-related
```

Details: [backend/CONTRIBUTING.md](./backend/CONTRIBUTING.md), [backend/tests/README.md](./backend/tests/README.md).

**Frontend**

```bash
cd frontend
pnpm lint
pnpm type-check
```

Details: [frontend/CONTRIBUTING.md](./frontend/CONTRIBUTING.md).

**Database**

- Prefer new migrations over editing applied history.
- **Never apply migrations by hand** (SQL editor, MCP, laptop `db push`) on local, staging, or production. Local: `cd skolist-db && supabase migration up --local`. Staging/production: GitHub Actions only. See [skolist-db/CONTRIBUTING.md](./skolist-db/CONTRIBUTING.md).
- Keep Python seed IDs / emails in sync with backend and e2e expectations.
- Run Python seeds from `skolist-db/venv` (`cd skolist-db && source venv/bin/activate`), never raw `python`.

Details: [skolist-db/CONTRIBUTING.md](./skolist-db/CONTRIBUTING.md).

**E2E**

```bash
cd e2e
npm run test:assessments   # or test:qgen / npm test
```

Details: [e2e/README.md](./e2e/README.md).

## Monorepo hooks

- Root [`.pre-commit-config.yaml`](./.pre-commit-config.yaml) runs Ruff on `backend/` when installed.
- Frontend uses Husky + lint-staged (Prettier) via `frontend/` prepare.

Install hooks from the packages you work in (see each SETUP / CONTRIBUTING).

## Security

- Never expose `SUPABASE_SERVICE_KEY` (or equivalent) to the browser.
- Do not bypass auth on `/api/v1/*` routes.
- Ask before changing auth, billing, or shared seed UUIDs used by tests.

## Setup

Local environment: **[SETUP.md](./SETUP.md)**.

## Local Instructions

The user may have written some instructions specific to their local environment. These are stored in the AGENTS.local.md file. Read them compulsorily before starting to work on the project.
And they are gitignored, so they are not committed to the repository.