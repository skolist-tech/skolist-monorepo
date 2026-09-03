# Frontend setup

Monorepo order: [../SETUP.md](../SETUP.md). You need local Supabase + backend (or remote stage) for authenticated flows.

## Requirements

- Node.js **20+**
- pnpm **9+**

## Install

```bash
cd frontend
pnpm install
```

Husky is installed via the `prepare` script (repo-root `.husky`).

## Environment

```bash
cp .env.example .env
```

Vite apps load env from **`frontend/.env`** (`envDir` points at the frontend root).

Minimum for local:

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<from supabase status>
VITE_FASTAPI_URL=http://127.0.0.1:8080
```

Use **no spaces** around `=` (e.g. `VITE_FASTAPI_URL=http://...`, not `VITE_FASTAPI_URL = ...`).

Do not commit `.env`. Do not put service-role keys here.

## Run

All apps (Turbo):

```bash
pnpm dev
```

One app:

```bash
pnpm --filter @skolist/landing-page dev
pnpm --filter @skolist/ai-paper-generator dev
pnpm --filter @skolist/assessments dev
pnpm --filter @skolist/ai-tutor dev
```

Storybook (shared UI):

```bash
pnpm storybook
```

## Build / quality

```bash
pnpm build
pnpm lint
pnpm type-check
```

See [CONTRIBUTING.md](./CONTRIBUTING.md).
