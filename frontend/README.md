# Frontend

pnpm + Turbo monorepo for Skolist web apps and shared packages.

## Docs

| Doc                                  | Purpose                                     |
| ------------------------------------ | ------------------------------------------- |
| [SETUP.md](./SETUP.md)               | Node/pnpm install, `.env`, running apps     |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Lint, type-check, app vs package boundaries |
| [INTERN_GUIDE.md](./INTERN_GUIDE.md) | Longer onboarding for interns               |

Each app has a **[PRODUCT_DESCRIPTION.md](#apps)** — a non-technical note on who the product is for and what it does. Read that before changing product behaviour.

Repo hub: [../README.md](../README.md) · [../SETUP.md](../SETUP.md) · [../CONTRIBUTING.md](../CONTRIBUTING.md)

## Apps

| App                       | Package name                  | Typical local port | Product                | Product description                                                        |
| ------------------------- | ----------------------------- | ------------------ | ---------------------- | -------------------------------------------------------------------------- |
| `apps/landing_page`       | `@skolist/landing-page`       | `3000`             | skolist.com            | [PRODUCT_DESCRIPTION.md](./apps/landing_page/PRODUCT_DESCRIPTION.md)       |
| `apps/ai_paper_generator` | `@skolist/ai-paper-generator` | `3001`             | qgen.skolist.com       | [PRODUCT_DESCRIPTION.md](./apps/ai_paper_generator/PRODUCT_DESCRIPTION.md) |
| `apps/ai_tutor`           | `@skolist/ai-tutor`           | (see app)          | aitutor.skolist.com    | [PRODUCT_DESCRIPTION.md](./apps/ai_tutor/PRODUCT_DESCRIPTION.md)           |
| `apps/assessments`        | `@skolist/assessments`        | `3003`             | Assessments (JEE/NEET) | [PRODUCT_DESCRIPTION.md](./apps/assessments/PRODUCT_DESCRIPTION.md)        |

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
