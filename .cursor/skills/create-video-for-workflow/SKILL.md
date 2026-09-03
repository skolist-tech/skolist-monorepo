---
name: create-video-for-workflow
description: >-
  Creates a temporary Playwright e2e test and records a video of a user-described
  workflow. Use when the user asks to create a video for a certain thing, record
  a workflow, capture a demo video, or produce a headed e2e recording.
---

# Create video for workflow

## Instructions

If user tells you to create video for certain thing,
then in the e2e folder write a test for it
then run relavant test
and video will be produced , tell that to user. and remind him to delete that test file it not needed as a e2e test

### How to run it in this repo

1. Put the temporary spec under `e2e/tests/` (prefer a clear name like `workflow-video-*.spec.ts`).
2. Reuse existing helpers (`e2e/tests/helpers/auth.ts`, assessment seeds) when the flow needs login or seed data.
3. Record with video enabled, e.g.:

```bash
cd e2e && E2E_VIDEO=1 npx playwright test --headed --workers=1 path/to/your.spec.ts
```

Or the project scripts: `npm run test:assessments:headed:video` / `npm run test:headed:video` when they match.

4. Tell the user the video path under `e2e/videos/` (gitignored).
5. Remind them to delete the temporary test file if it is not meant to stay as a real e2e test.
