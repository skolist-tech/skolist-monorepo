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

## Branches

Work from an up-to-date `stage` (or the branch your team designates), never commit directly to `main` / `stage` unless you own releases.

| Prefix | Use |
| --- | --- |
| `feature/<short-name>` | New behaviour |
| `bugs/<short-name>` | Bug fixes |
| `chore/<short-name>` | Tooling, docs, CI |

Examples: `feature/assessment-login-e2e`, `bugs/fix-navbar-overflow`, `chore/setup-docs`.

## Pull requests

1. Keep PRs focused (one concern per PR when practical).
2. Describe **why** and how to test (checklist welcome).
3. Ensure package checks pass (see below) before requesting review.
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
  - [`create-video-for-workflow`](./.cursor/skills/create-video-for-workflow/SKILL.md) — when asked for a video of a workflow, write a temporary e2e test, run it with `E2E_VIDEO=1`, point at `e2e/videos/`, and remind the user to delete the test if it should not stay in the suite.

## Quality bar (by area)

Run the checks for the packages you touched:

**Backend**

```bash
cd backend
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
- Keep Python seed IDs / emails in sync with backend and e2e expectations.

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
