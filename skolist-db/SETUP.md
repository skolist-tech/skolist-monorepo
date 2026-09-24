# skolist-db setup

Monorepo order: [../SETUP.md](../SETUP.md). This is usually the **first** package you start.

## Requirements

- Docker
- [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started)
- Python **3.11+** (for `python_seeds` / `seed.py`)

## Start local Supabase

```bash
cd skolist-db/supabase   # or skolist-db if your CLI is configured for that cwd
supabase start
```

Copy **API URL**, **anon key**, and **service_role key** into:

- `backend/.env`
- `frontend/.env`
- optionally `e2e/.env`

Status anytime:

```bash
supabase status
```

Stop:

```bash
supabase stop
```

## Schema + SQL seeds

Migrations under `supabase/migrations/` apply on start / reset. To rebuild from scratch:

```bash
cd skolist-db/supabase
supabase db reset
```

That reapplies migrations and SQL seeds under `supabase/seeds/`.

## Python seeds

Auth users and richer product data are applied with Python (after the DB is up):

```bash
cd skolist-db
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Put `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (or the names your seed client expects) in the env used by the scripts — often `skolist-db/.env` or the same values as backend.

Run everything in order (`seed.py` auto-discovers scripts):

```bash
python seed.py
```

Discovery rule: any `python_seeds/*.py` whose name **starts with `_`** and **contains `_seed_`**, sorted by filename. Examples:

- `_001_seed_orgs.py`, `_002_seed_users.py`, … (committed)
- `_local_seed_experiments.py` (gitignored — safe for local-only scratch seeds)

Or run one script directly:

```bash
python python_seeds/_001_seed_orgs.py
python python_seeds/_002_seed_users.py
python python_seeds/_003_seed_activities.py
python python_seeds/_004_seed_assessment.py
```

Default seed password for many users is `password123` (see `python_seeds/data/_002_data_user.py`). Assessment e2e and backend fixtures expect those emails / stable UUIDs. Assessment sign-in also needs `organisation_code` `SEEDOR` on Seed Organisation (set by `_001_seed_orgs.py` after the `orgs_organisation_code` migration).

Seeded users also get a public avatar SVG in the `seed_assets` storage bucket (`public.users.avatar_url`). A few assessment questions get figure SVGs in the same bucket (`assessment.questions.image_url`). Re-run `_002_seed_users.py` / `_004_seed_assessment.py` (or `python seed.py`) after `supabase db reset` so those objects exist.

## Wipe and reseed

```bash
python unseed.py --all    # or -a; wipes app tables (not Supabase internals)
python seed.py
```

See `unseed.py --help` for table-scoped deletes.

## Cloud projects

Linking / `db reset --linked` notes: [supabase/README.md](./supabase/README.md). Prefer careful review before resetting a shared cloud project.
