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

## Shared packages and TypeScript

Apps **project-reference** packages (`@skolist/auth`, `@skolist/ui`, `@skolist/utils`, …) and type-check against **emitted declarations in `packages/<name>/dist`**, not the live `.ts` / `.tsx` source. `dist` is gitignored.

After you change a package’s **public types or component props**, rebuild that package before `pnpm type-check` in an app (or the new props look missing):

```bash
pnpm --filter @skolist/auth build
# same pattern: pnpm --filter @skolist/ui build
```

`pnpm type-check` from `frontend/` runs package `build` scripts via Turbo when the graph requires it; a filtered app-only `tsc` does **not**, so a stale `dist` will fail.

## Apps vs e2e

- Unit / component tests for qgen live under the app (Vitest where configured).
- Browser flows that need backend + DB belong in **[../e2e/](../e2e/README.md)**.
- The Cursor IDE browser tab often **cannot open `localhost` / `127.0.0.1` apps**. Verify assessments (and other local UIs) with Playwright from `e2e/` or `curl` against `127.0.0.1`, not that tab.

## Branches & PRs

Follow monorepo [../CONTRIBUTING.md](../CONTRIBUTING.md) (`feature/*`, `bugs/*`, `chore/*`). Do not push to `main` / `stage` unless you own releases.

Intern-oriented walkthrough: [INTERN_GUIDE.md](./INTERN_GUIDE.md).
