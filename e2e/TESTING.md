# E2E testing

Playwright drives the frontend in a browser. Supabase and the backend must already be running; Playwright launches the frontend (or reuses one already on the port). How to run: [README.md](./README.md). Repo map: [../TESTING.md](../TESTING.md).

| Folder | Inventory |
| --- | --- |
| [tests/](./tests/TESTING.md) | QGen smoke/login and the browser-check spec |
| [tests/assessment_api/](./tests/assessment_api/TESTING.md) | Assessments teacher and student flows |

```bash
cd e2e
npm run test:qgen
npm run test:assessments
```
