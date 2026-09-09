# Setup (monorepo)

Bring up a full local stack in this order. Package-specific steps live in each `SETUP.md` — this file is the map.

## Requirements (host)

- Docker (for local Supabase; also used for backend compose)
- [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started)
- Python **3.11+** (backend + Python seeds)
- Node.js **20+** and **pnpm 9+** (frontend + e2e)

## 1. Database — `skolist-db`

```bash
cd skolist-db
```

Follow **[skolist-db/SETUP.md](./skolist-db/SETUP.md)**:

- `supabase start`
- apply / reset schema
- run Python seeds (`python seed.py` or individual scripts)

You need API URL + anon / service keys from `supabase status` for backend and frontend `.env` files.

### Seed login credentials

Python seeds create shared demo users (defined in `skolist-db/python_seeds/data/_002_data_user.py`). Every seeded user uses the same password:

| | |
| --- | --- |
| Password | `password123` (`DEFAULT_PASSWORD`) |
| Examples | `teacher1@seed.skolist.com`, `student1@seed.skolist.com`, `student2@seed.skolist.com`, `student3@seed.skolist.com`, `test@example.com` |

Emails are listed in that data file; the password is **not** repeated per user — it comes from `DEFAULT_PASSWORD`. Seeded users also get an avatar at `public.users.avatar_url` (SVG in the `seed_assets` bucket).

## 2. Backend — `backend`

```bash
cd backend
```

Follow **[backend/SETUP.md](./backend/SETUP.md)**:

- venv + `requirements-dev.txt`
- `.env` from local Supabase keys
- run with `uvicorn` **or** `docker compose up`

**Docker note:** if the API runs in Compose and Supabase is on the host, use `SUPABASE_URL=http://host.docker.internal:54321` (not `127.0.0.1`).

Smoke check: `GET http://127.0.0.1:8080/`

## 3. Frontend — `frontend`

```bash
cd frontend
```

Follow **[frontend/SETUP.md](./frontend/SETUP.md)**:

- `pnpm install`
- `frontend/.env` with `VITE_SUPABASE_*` and `VITE_FASTAPI_URL` (no spaces around `=`)
- `pnpm dev` or filter a single app

Typical local ports:

| App | Port (dev) |
| --- | --- |
| Landing | `3000` |
| AI Paper Generator (qgen) | `3001` |
| Assessments | `3003` |

## 4. E2E (optional) — `e2e`

With Supabase + backend + seeds already up:

```bash
cd e2e
```

Follow **[e2e/README.md](./e2e/README.md)** (`npm install`, Playwright browsers, `npm test` / project scripts).

## Suggested first-time checklist

- [ ] `skolist-db`: Supabase running; seeds applied
- [ ] `backend`: `.env` filled; API responds on `:8080`
- [ ] `frontend`: `.env` filled; at least one app loads
- [ ] (Optional) `e2e`: assessment or qgen project passes

## Next

- Day-to-day contribution rules: **[CONTRIBUTING.md](./CONTRIBUTING.md)**
- Package overviews: root **[README.md](./README.md)**
