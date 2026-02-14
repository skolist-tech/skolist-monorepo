# Skolist Frontend – Intern Guide

Welcome! This repository contains the frontend code for **Skolist**.
Please read this once before starting work — it will save you (and everyone else) time.

---

## What is this repository?

This is a **frontend monorepo** that contains multiple web apps and shared code.

You will mostly work inside:

- an **app** (a website)
- or a **shared package** (UI, auth, utilities)

---

## Repository Structure (High Level)

```
frontend/
├── apps/        → Actual websites (you will work here most often)
├── packages/    → Shared code used by all apps
├── .storybook/  → UI documentation (Storybook)
└── config files → Build, lint, and tooling configs
```

### Apps (Websites)

| App                  | URL                 | Purpose                     |
| -------------------- | ------------------- | --------------------------- |
| `landing_page`       | skolist.com         | Public landing website      |
| `ai_paper_generator` | qgen.skolist.com    | AI question paper generator |
| `ai_tutor`           | aitutor.skolist.com | AI tutoring app             |

Each app is **independent**, but shares common code.

---

### Shared Packages

You usually **import** these, not modify them unless asked.

| Package           | Purpose                                          |
| ----------------- | ------------------------------------------------ |
| `@skolist/ui`     | Reusable UI components (buttons, cards, dialogs) |
| `@skolist/auth`   | Login, logout, authentication logic              |
| `@skolist/utils`  | Small helper utilities                           |
| `@skolist/config` | Shared Tailwind / TypeScript configs             |

---

## Before You Start (One-Time Setup)

### Requirements

- Node.js **20+**
- pnpm **9+**

If unsure, ask before proceeding.

---

### Install Dependencies

```bash
pnpm install
```

---

### Environment Variables

```bash
cp .env.example .env
```

Ask a senior for the correct values.
**Do not commit `.env` files.**

---

## Running the Project Locally

### Start all apps

```bash
pnpm dev
```

---

### Run a specific app

```bash
pnpm --filter @skolist/landing-page dev
pnpm --filter @skolist/ai-paper-generator dev
pnpm --filter @skolist/ai-tutor dev
```

---

### Storybook (UI Components)

Use this to view and test shared UI components.

```bash
pnpm storybook
```

---

## Code Quality Commands

Run these **before pushing code**.

```bash
pnpm lint
pnpm type-check
```

Fix errors if any appear.

---

## Git Workflow (VERY IMPORTANT)

We follow a **strict Git workflow**.
Breaking it can block the whole team.

---

### Branch Rules

| Branch      | Who can push | Purpose    |
| ----------- | ------------ | ---------- |
| `main`      | Seniors only | Production |
| `stage`     | Seniors only | Staging    |
| `feature/*` | Everyone     | Your work  |
| `bugs/*`    | Everyone     | Bug fixes  |
| `chore/*`   | Everyone     | Infra work |

❌ Never push to `main`
❌ Never push to `stage`

---

## Step-by-Step: How You Should Work

### 1️⃣ Start from `stage`

Clone the repo:

```bash
git clone https://github.com/skolist-tech/frontend_monorepo.git
cd ./frontend_monorepo
```

Always sync first:

```bash
git checkout stage
git pull origin stage
pnpm install
```

---

### 2️⃣ Create your own branch

For features:

```bash
git checkout -b feature/<short-name>
```

For bugs:

```bash
git checkout -b bugs/<short-name>
```

For Infra / Ops work:

```bash
git checkout -b chore/<short-name>
```

Examples:

- `feature/add-login-ui`
- `bugs/fix-navbar-overflow`
- `chore/setup-ci`

---

### 3️⃣ Make changes and commit

```bash
git add .
git commit -m "Clear description of what you changed"
```

Bad message ❌: `fix`, `update`, `changes`
Good message ✅: `Fix redirect after login`

---

### 4️⃣ Push your branch

```bash
git push -u origin feature/<short-name>
```

---

### 5️⃣ Open a Pull Request (PR)

After pushing, GitHub will show **"Compare & pull request"**.

Make sure:

- **Base branch** → `stage`
- **Compare branch** → your branch

Explain:

- what you changed
- why you changed it

If there is an issue number, mention it:

```
Fixes #123
```

---

### 6️⃣ Review & Merge

- Seniors will review your PR
- You may be asked to update code
- Once approved, it will be merged into `stage`
- Staging is auto-deployed on Vercel

❌ Do NOT merge your own PR
❌ Do NOT open PRs to `main`

---

## General Rules

- One feature or bug per PR
- Keep PRs small and focused
- Ask questions early if stuck
- Don't "experiment" directly on shared packages
- Don't bypass checks or rules

---

### Final note ❤️

This setup exists to:

- protect production
- help you learn clean workflows
- make reviews fast and fair

If something is unclear — **ask before guessing**.
