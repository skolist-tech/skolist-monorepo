# E2E tests (root specs)

Parent: [../TESTING.md](../TESTING.md). Assessments specs: [assessment_api/TESTING.md](./assessment_api/TESTING.md).

| File | Project | What it covers |
| --- | --- | --- |
| `smoke.spec.ts` | `qgen` | Homepage loads; a signed-out user is sent to `/login`. |
| `login.spec.ts` | `qgen` | Seeded email and password reach the dashboard; a wrong password stays on login with an error. |
| `browser-check.spec.ts` | browser-check config | Opens one headed Chromium window so window-manager rules can be checked. Does not start the apps. |
