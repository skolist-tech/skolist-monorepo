# E2E test list

Tracked Playwright specs under `tests/`. How to run them: [README.md](./README.md). Per-folder writeups: [TESTING.md](./TESTING.md).

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
| [`tests/assessment_api/auth.spec.ts`](./tests/assessment_api/auth.spec.ts) | Guest is sent to email + password + org-code sign-in (no sign-up, Google, or phone). The worker's e2e teacher lands on the test list; the worker's e2e student lands on assigned tests. |

### Teachers

| File | What it covers |
| --- | --- |
| [`tests/assessment_api/teachers/teacher.spec.ts`](./tests/assessment_api/teachers/teacher.spec.ts) | Teacher 1 sees all seed papers (including draft and closed). Opens the draft JEE Advanced editor (Publish). Opens a live NEET paper and sees attempts. **Open** on a draft card goes to the editor; **Back** returns to the tests list. |
| [`tests/assessment_api/teachers/workflow.spec.ts`](./tests/assessment_api/teachers/workflow.spec.ts) | The worker's e2e teacher creates a named draft; adds/edits a question and saves; assigns that worker's e2e student from the name/photo search; publishes a new draft; closes a published paper and lands back on the list as closed. Delete bin on a card opens a confirm modal: Cancel keeps the paper, Delete removes it. |
| [`tests/assessment_api/teachers/author-and-publish.spec.ts`](./tests/assessment_api/teachers/author-and-publish.spec.ts) | One journey: the worker's e2e teacher logs in, creates a draft, adds a section and two MCQs, edits stems/options/keys, and publishes. |

### Students

| File | What it covers |
| --- | --- |
| [`tests/assessment_api/students/student.spec.ts`](./tests/assessment_api/students/student.spec.ts) | Assigned list shows published seeds, not draft/closed. Student 3 sees **No attempt yet** on JEE Main Mock Test 1. Student 1 opens a live NEET paper into the NTA UI (instructions, palette, Save & Next). |
| [`tests/assessment_api/students/workflow.spec.ts`](./tests/assessment_api/students/workflow.spec.ts) | Student 3 starts NEET Open, answers, Save & Next, then jumps back to question 1 via the palette. |
| [`tests/assessment_api/students/attempt-authored-paper.spec.ts`](./tests/assessment_api/students/attempt-authored-paper.spec.ts) | The worker's e2e teacher authors, assigns that worker's e2e student, and publishes. The student sits the paper (correct answers), submits, sees 8/8, then **Back** to assigned tests. The teacher reviews the graded attempt, then **Back** to the paper. |
| [`tests/assessment_api/students/unreleased-paper.spec.ts`](./tests/assessment_api/students/unreleased-paper.spec.ts) | The worker's e2e student does not see a draft they were assigned, a published paper that was never assigned, or a paper after the teacher closes it. |
| [`tests/assessment_api/students/jee-main-complete-attempt.spec.ts`](./tests/assessment_api/students/jee-main-complete-attempt.spec.ts) | Student 2 sits JEE Main Mock Test 1 end to end (paced for a headed recording). Physics Q1 shows the inline stem SVG and option badge SVGs. |

## Browser check (`npm run test:browser`)

Separate config (`playwright.browser-check.config.ts`). Does not start qgen or assessments.

| File | What it covers |
| --- | --- |
| [`tests/browser-check.spec.ts`](./tests/browser-check.spec.ts) | Opens one headed Chromium window so you can check window-manager / Hyprland rules. |
