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

Pace the recording like a person watching: at least **0.5–1 second** between clicks (and similarly after typing, opening menus, or navigating). Use `page.waitForTimeout(500)`–`page.waitForTimeout(1000)` (or equivalent) so frames are not a blur of instant actions. Do not click as fast as Playwright can.

### How to run it in this repo

1. Put the temporary spec under `e2e/tests/` (for assessments, prefer
   `e2e/tests/assessment_api/students/` or `e2e/tests/assessment_api/teachers/`
   with a clear name like `jee-main-complete-attempt.spec.ts`).
2. Reuse existing helpers (`e2e/tests/helpers/auth.ts`, assessment seeds) when the flow needs login or seed data.
3. Record with video enabled. Cursor’s agent sandbox may set
   `PLAYWRIGHT_BROWSERS_PATH` to an empty `/tmp/cursor-sandbox-cache/.../playwright`.
   Do **not** `playwright install` into that cache. Point at (or link from) the
   user’s existing browsers:

```bash
cd e2e
USER_PW="$HOME/.cache/ms-playwright"
# Prefer the user cache in-place (no copy, no download):
PLAYWRIGHT_BROWSERS_PATH="$USER_PW" E2E_VIDEO=1 E2E_IMAGES=1 npx playwright test --headed --workers=1 --project=assessments path/to/your.spec.ts
```

If a run still looks under the sandbox path, symlink instead of copying:

```bash
mkdir -p "$PLAYWRIGHT_BROWSERS_PATH"
for d in "$HOME/.cache/ms-playwright"/*; do
  ln -sfn "$d" "$PLAYWRIGHT_BROWSERS_PATH/$(basename "$d")"
done
```

Or the project scripts: `npm run test:assessments:headed:video:images` / `npm run test:headed:video:images` when they match (still prefix `PLAYWRIGHT_BROWSERS_PATH="$HOME/.cache/ms-playwright"` in agent runs).

4. Tell the user the video path under `e2e/videos/<timestamp>/…` (gitignored; older timestamp folders are kept). If `E2E_IMAGES=1`, also point at `images/` next to `video.webm` (`frame_001.jpg` …). Needs `ffmpeg` on PATH.
5. Remind them to delete the temporary test file if it is not meant to stay as a real e2e test.
