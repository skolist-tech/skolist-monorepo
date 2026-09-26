# skolist-db

Supabase project for Skolist: migrations, SQL seeds, and Python seed scripts (auth users, activities, assessment data).

## Docs

| Doc | Purpose |
| --- | --- |
| [SETUP.md](./SETUP.md) | Local Supabase, reset, Python seeds / unseed |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Migrations vs seeds, conventions |
| [TESTING.md](../TESTING.md) | Repo test map; this package has no suite of its own |
| [supabase/README.md](./supabase/README.md) | Extra CLI / cloud linking notes |

Repo hub: [../README.md](../README.md) · [../SETUP.md](../SETUP.md) · [../CONTRIBUTING.md](../CONTRIBUTING.md) · [../TESTING.md](../TESTING.md)

## Layout

```
skolist-db/
├── supabase/
│   ├── config.toml
│   ├── migrations/     # Schema + SQL changes (ordered)
│   └── seeds/          # SQL seed files (applied on db reset)
├── python_seeds/       # Auth users, orgs, activities, assessment rows
│   └── import_paper.py # Load one extracted paper.json as teacher1's draft test
├── seed.py             # Auto-discovers python_seeds/_…_seed_….py in order
└── unseed.py           # Wipes application tables for a clean reseed
```

Other packages (backend, frontend, e2e) depend on this for local development.

Import an extracted paper as a draft test for `teacher1@seed.skolist.com`:

```bash
cd skolist-db
python python_seeds/import_paper.py ../extraction_app/runs/mht-cet-2025/paper.json
```
