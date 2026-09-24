# Backend

FastAPI service for Skolist: Supabase JWT auth, question generation, assessment API, and related product endpoints.

## Docs

| Doc | Purpose |
| --- | --- |
| [SETUP.md](./SETUP.md) | Local install, `.env`, run with uvicorn or Docker |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Lint, tests, adding routes |
| [TESTING.md](./TESTING.md) | Unit vs integration, and the tests in each folder |
| [tests/README.md](./tests/README.md) | How to run pytest |
| [INTERN_GUIDE.md](./INTERN_GUIDE.md) | Longer onboarding for interns |

Repo hub: [../README.md](../README.md) · [../SETUP.md](../SETUP.md) · [../CONTRIBUTING.md](../CONTRIBUTING.md) · [../TESTING.md](../TESTING.md)

## Layout (high level)

```
backend/
├── app.py / main.py     # App factory and entrypoint
├── api/v1/              # Versioned HTTP routes (auth enforced)
│   └── assessment/      # JEE/NEET-style assessment API
├── config/              # Settings, logging, startup pings
├── services/            # Business logic
├── tests/               # unit/ + integration/
├── docker-compose.yaml
└── requirements*.txt
```

## License

Apache License 2.0. “Skolist” is a trademark of Skolist Tech.
