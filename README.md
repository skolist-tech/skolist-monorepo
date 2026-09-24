# Skolist monorepo

Platform code for Skolist: database (Supabase), FastAPI backend, frontend apps, and Playwright e2e tests.

## Docs

| Doc | Purpose |
| --- | --- |
| [AGENTS.md](./AGENTS.md) | Instructions for AI agents working in this repo |
| [SETUP.md](./SETUP.md) | Get a local stack running (DB → API → apps → e2e) |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Branches, PRs, and quality bar |
| [TESTING.md](./TESTING.md) | Unit, integration, and e2e: what each needs, and what to add |

Package-level docs:

| Package | README | Setup | Contributing | Testing |
| --- | --- | --- | --- | --- |
| [backend/](./backend/) | [README](./backend/README.md) | [SETUP](./backend/SETUP.md) | [CONTRIBUTING](./backend/CONTRIBUTING.md) | [TESTING](./backend/TESTING.md) |
| [frontend/](./frontend/) | [README](./frontend/README.md) | [SETUP](./frontend/SETUP.md) | [CONTRIBUTING](./frontend/CONTRIBUTING.md) | [e2e TESTING](./e2e/TESTING.md) |
| [skolist-db/](./skolist-db/) | [README](./skolist-db/README.md) | [SETUP](./skolist-db/SETUP.md) | [CONTRIBUTING](./skolist-db/CONTRIBUTING.md) | — |
| [e2e/](./e2e/) | [README](./e2e/README.md) | — | — | [TESTING](./e2e/TESTING.md) |

Also useful:

- [backend/tests/README.md](./backend/tests/README.md) — how to run unit / integration pytest
- [infra/README.md](./infra/README.md), [aws-cdk-infra/README.md](./aws-cdk-infra/README.md) — infrastructure

## Layout

```
skolist-monorepo/
├── skolist-db/     # Supabase migrations, SQL seeds, Python seeds
├── backend/        # FastAPI API (auth, qgen, assessment, …)
├── frontend/       # pnpm + Turbo monorepo (landing, qgen, tutor, assessments)
├── e2e/            # Playwright end-to-end tests
├── infra/          # Supporting infra notes / configs
└── aws-cdk-infra/  # AWS CDK
```

## Quick start

1. Follow **[SETUP.md](./SETUP.md)** (starts with `skolist-db`, then backend, then frontend).
2. Read **[CONTRIBUTING.md](./CONTRIBUTING.md)** before opening a PR.
3. Use the package README for day-to-day commands in that area.

## License

Package licenses live under each tree (e.g. backend / frontend). “Skolist” is a trademark of Skolist Tech.
