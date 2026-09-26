# Backend testing

Pytest under `tests/`. How to run it: [tests/README.md](./tests/README.md). Repo map: [../TESTING.md](../TESTING.md).

| Folder | Needs | Inventory |
| --- | --- | --- |
| [tests/unit/](./tests/unit/TESTING.md) | Python only. No database, no frontend. | [TESTING.md](./tests/unit/TESTING.md) |
| [tests/integration/](./tests/integration/TESTING.md) | Local Supabase plus this backend. Chromium for the API process; no frontend. | [TESTING.md](./tests/integration/TESTING.md) |

```bash
cd backend && source venv/bin/activate
pytest tests/unit
pytest tests/integration
```

Unit tests mock Supabase, LLMs, and other I/O. Integration tests talk to a real local database and the FastAPI app.
