---
name: developement-skolist-monorepo
description: >-
  Developement skolist monorepo
---

# Agent instructions

This file applies to **every** task in this monorepo.

## Before changing code or committing

1. Read the root **[README.md](./README.md)**.
2. Follow every doc it links that is relevant to the area you will touch (for example `SETUP.md`, `CONTRIBUTING.md`, and the package `README` / `SETUP` / `CONTRIBUTING` under `backend/`, `frontend/`, `skolist-db/`, or `e2e/`).
3. Prefer those docs over guessing commands, env vars, seed data, branch rules, or test layout.
4. Do **not** edit the codebase or create a commit until that reading is done for the packages in scope.

## GitHub

Use the **`gh` CLI** for all GitHub work in this repo: issues, pull requests, checks, releases, branch/PR inspection, and reviewing CI failures. Prefer `gh` over the GitHub website or inventing raw `curl`/`api.github.com` calls.

## After you finish

If the work reveals missing or wrong docs, update the relevant README / SETUP / CONTRIBUTING (or note it for the human), per [CONTRIBUTING.md](./CONTRIBUTING.md).


## User Side Tips

- If the user says you something related to changed in codebase, and you haven't done them, then without doing any further change just report that to the user.