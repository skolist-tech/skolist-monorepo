# Frontend

pnpm + Turbo monorepo for Skolist web apps and shared packages.

## Docs

| Doc                                  | Purpose                                     |
| ------------------------------------ | ------------------------------------------- |
| [SETUP.md](./SETUP.md)               | Node/pnpm install, `.env`, running apps     |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Lint, type-check, app vs package boundaries |
| [INTERN_GUIDE.md](./INTERN_GUIDE.md) | Longer onboarding for interns               |

Repo hub: [../README.md](../README.md) · [../SETUP.md](../SETUP.md) · [../CONTRIBUTING.md](../CONTRIBUTING.md)

## Apps

| App                       | Package name                  | Typical local port | Product                |
| ------------------------- | ----------------------------- | ------------------ | ---------------------- |
| `apps/landing_page`       | `@skolist/landing-page`       | `3000`             | skolist.com            |
| `apps/ai_paper_generator` | `@skolist/ai-paper-generator` | `3001`             | qgen.skolist.com       |
| `apps/ai_tutor`           | `@skolist/ai-tutor`           | (see app)          | aitutor.skolist.com    |
| `apps/assessments`        | `@skolist/assessments`        | `3003`             | Assessments (JEE/NEET) |

## Shared packages

| Package           | Role                               |
| ----------------- | ---------------------------------- |
| `@skolist/ui`     | Shared UI components               |
| `@skolist/auth`   | Login / session / protected routes |
| `@skolist/utils`  | Small helpers                      |
| `@skolist/db`     | Generated / shared DB types        |
| `@skolist/config` | Shared TS / Tailwind configs       |

## License

Apache License 2.0. “Skolist” is a trademark of Skolist Tech.
