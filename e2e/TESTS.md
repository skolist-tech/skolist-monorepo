# E2E test list

Tracked Playwright specs under `tests/`. How to run them: [README.md](./README.md).

Recorder specs live in gitignored `video_test/` folders and are not listed here.

## QGen (`--project=qgen`)

| File | What it covers |
| --- | --- |
| [`tests/smoke.spec.ts`](./tests/smoke.spec.ts) | QGen homepage loads; unauthenticated users are sent to `/login`. |
| [`tests/login.spec.ts`](./tests/login.spec.ts) | Seeded email/password reaches the dashboard; a wrong password stays on login with an error. |

## Assessments (`--project=assessments`)

Credentials and paper titles: [`tests/assessment_api/seed.ts`](./tests/assessment_api/seed.ts).

### Shared

| File | What it covers |
| --- | --- |
| [`tests/assessment_api/auth.spec.ts`](./tests/assessment_api/auth.spec.ts) | Guest is sent to a simple Assessments login (no QGen marketing). Teacher 1 lands on the test list; Student 1 lands on assigned tests. |

### Teachers

| File | What it covers |
| --- | --- |
| [`tests/assessment_api/teachers/teacher.spec.ts`](./tests/assessment_api/teachers/teacher.spec.ts) | Teacher 1 sees all seed papers (including draft and closed). Opens the draft JEE Advanced editor (Publish). Opens a live NEET paper and sees attempts. **Open** on a draft card goes to the editor. |
| [`tests/assessment_api/teachers/workflow.spec.ts`](./tests/assessment_api/teachers/workflow.spec.ts) | Teacher 2 creates a named draft; adds/edits a question and saves; assigns Student 3 from the name/photo search; publishes a new draft. |

### Students

| File | What it covers |
| --- | --- |
| [`tests/assessment_api/students/student.spec.ts`](./tests/assessment_api/students/student.spec.ts) | Assigned list shows published seeds, not draft/closed. Student 3 sees **No attempt yet** on JEE Main Mock Test 1. Student 1 opens a live NEET paper into the NTA UI (instructions, palette, Save & Next). |
| [`tests/assessment_api/students/workflow.spec.ts`](./tests/assessment_api/students/workflow.spec.ts) | Student 3 starts NEET Open, answers, Save & Next, then jumps back to question 1 via the palette. |
| [`tests/assessment_api/students/jee-main-complete-attempt.spec.ts`](./tests/assessment_api/students/jee-main-complete-attempt.spec.ts) | Student 2 sits JEE Main Mock Test 1 end to end (paced for a headed recording). |
| [`tests/assessment_api/students/nta-jee-main-attempt.spec.ts`](./tests/assessment_api/students/nta-jee-main-attempt.spec.ts) | Student 1 on the local full-length JEE Main mock: instructions gate, NTA chrome, answer, Save & Next, mark for review. Needs the gitignored full-paper seed. |

## Browser check (`npm run test:browser`)

Separate config (`playwright.browser-check.config.ts`). Does not start qgen or assessments.

| File | What it covers |
| --- | --- |
| [`tests/browser-check.spec.ts`](./tests/browser-check.spec.ts) | Opens one headed Chromium window so you can check window-manager / Hyprland rules. |
