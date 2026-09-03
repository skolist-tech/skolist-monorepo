# Contributing to the frontend

Repo-wide rules: [../CONTRIBUTING.md](../CONTRIBUTING.md). Setup: [SETUP.md](./SETUP.md).

## Before you push

```bash
cd frontend
pnpm lint
pnpm type-check
```

Prettier runs on staged files via lint-staged / Husky.

## Where to change code

- **Product behaviour / pages** → `apps/<app>/`
- **Shared UI or auth** → `packages/ui`, `packages/auth`, etc. (coordinate — many apps depend on them)
- Prefer existing patterns in `@skolist/ui` and `@skolist/auth` over one-off copies

## Apps vs e2e

- Unit / component tests for qgen live under the app (Vitest where configured).
- Browser flows that need backend + DB belong in **[../e2e/](../e2e/README.md)**.

## Branches & PRs

Follow monorepo [../CONTRIBUTING.md](../CONTRIBUTING.md) (`feature/*`, `bugs/*`, `chore/*`). Do not push to `main` / `stage` unless you own releases.

Intern-oriented walkthrough: [INTERN_GUIDE.md](./INTERN_GUIDE.md).
