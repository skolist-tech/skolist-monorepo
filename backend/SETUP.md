# Backend setup

Prerequisites and monorepo order: [../SETUP.md](../SETUP.md) (start Supabase in `skolist-db` first).

## Requirements

- Python **3.11+**
- Local Supabase running (see [../skolist-db/SETUP.md](../skolist-db/SETUP.md))
- Docker (optional, for Compose)

## Install

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements-dev.txt
pre-commit install          # repo-root .pre-commit-config.yaml
```

## Environment

```bash
cp .env.example .env
```

Fill from `supabase status` (or your cloud project):

| Variable | Notes |
| --- | --- |
| `SUPABASE_URL` | Local: `http://127.0.0.1:54321` on host; **`http://host.docker.internal:54321`** inside Compose |
| `SUPABASE_PUBLIC_URL` | Origin browsers use for Supabase links (signed image URLs). Defaults to `SUPABASE_URL`. Set to `http://127.0.0.1:54321` when the API runs in Compose |
| `SUPABASE_SERVICE_KEY` | Service role — server only |
| `SUPABASE_ANON_KEY` | Used by some tests / clients |
| `OPENAI_API_KEY` / `GEMINI_API_KEY` | As needed for AI features |
| `DEPLOYMENT_ENV` | `LOCAL` for local CORS / behaviour |

Never commit `.env`. Never put the service key in frontend code.

## Run on the host

```bash
source venv/bin/activate
uvicorn main:app --reload --port 8080
```

Check: `GET http://127.0.0.1:8080/`

The API launches Chromium on startup. Install the browser that belongs to the pinned `playwright` version (the same version as `e2e/package.json`):

```bash
playwright install chromium
```

## Run with Docker Compose

```bash
cd backend
docker compose up --build
```

The image is `mcr.microsoft.com/playwright/python` at the same Playwright version as `pyproject.toml`. That image already includes Chromium. Rebuild after changing the pin.

Compose maps `8080:8080`, loads `.env`, and mounts the tree. If Supabase is on the host, set:

```env
SUPABASE_URL=http://host.docker.internal:54321
SUPABASE_PUBLIC_URL=http://127.0.0.1:54321
```

(`extra_hosts` for `host.docker.internal` is already in `docker-compose.yaml`.)

**Compose does not hot-reload Python.** The repo is bind-mounted into the container, but uvicorn is started **without** `--reload`. New or changed routes (and other Python edits) stay invisible — often as **404** — until you restart the API process:

```bash
cd backend
docker compose restart
```

Host `uvicorn main:app --reload --port 8080` **does** pick up file changes. Restart Compose (or recreate the container) after adding endpoints if you use Docker.

## Smoke auth

Routes under `/api/v1/*` expect `Authorization: Bearer <Supabase JWT>`.

```bash
curl -H "Authorization: Bearer <JWT>" http://127.0.0.1:8080/api/v1/hello
```

## Tests

See [tests/README.md](./tests/README.md) and [CONTRIBUTING.md](./CONTRIBUTING.md).
