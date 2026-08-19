---
name: tkt-rules
description: "Initialize and maintain project AGENTS.md + CLAUDE.md with progressive disclosure. Detect tech stack from config files, ask user for project-specific rules, generate concise WHAT/WHY/HOW documentation. Use when user says 'initialize project rules', 'generate AGENTS.md', 'maintain CLAUDE.md', 'tkt rules', or invokes /tkt-rules. Triggers: project rules, AGENTS.md, CLAUDE.md, initialize project, setup AI rules, update AGENTS.md, project onboarding."
metadata:
  scope: project
---

# tkt-rules

IRON LAW: Generated AGENTS.md must be under 300 lines. Commands must be exact syntax. Only write what the AI cannot guess from code.

## Workflow

Copy this checklist and check off items as you complete them:

```
tkt-rules Progress:

- [ ] Step 1: Detect project tech stack ⚠️ REQUIRED
  - [ ] 1.1 Read config files (package.json, go.mod, pyproject.toml, etc.)
  - [ ] 1.2 Read .nvmrc / .node-version
  - [ ] 1.3 Read framework configs (vite.config.*, next.config.*, tsconfig.json)
  - [ ] 1.4 Read README.md first 50 lines
  - [ ] 1.5 List root directory (no recursion)
- [ ] Step 2: Present detection summary to user ⚠️ REQUIRED
- [ ] Step 3: AskUserQuestion four questions ⚠️ REQUIRED
  - [ ] 3.1 One-liner project description
  - [ ] 3.2 Project type (cli / web / library / service / other)
  - [ ] 3.3 Main language and framework
  - [ ] 3.4 Special rules (forbidden directories / historical pitfalls / compatibility logic)
- [ ] Step 4: Confirm overwrite strategy ⚠️ REQUIRED
- [ ] Step 5: Generate AGENTS.md + CLAUDE.md
- [ ] Step 6: Generate PostToolUse hooks for detected checkers
- [ ] Step 7: Report output
```

## Step 1: Detect Project Tech Stack ⚠️ REQUIRED

Read these files if they exist:

**Language/runtime:**
- `package.json` — dependencies, packageManager, engines.node, scripts
- `.nvmrc` / `.node-version` — Node version
- `go.mod` — Go module
- `pyproject.toml` / `requirements.txt` — Python
- `Cargo.toml` — Rust
- `pom.xml` / `build.gradle` — Java
- `Gemfile` — Ruby
- `composer.json` — PHP

**Framework/build:**
- `tsconfig.json` / `jsconfig.json` — TypeScript/JavaScript
- `next.config.*` — Next.js
- `vite.config.*` — Vite
- `nuxt.config.*` — Nuxt
- `astro.config.*` — Astro
- `tailwind.config.*` — Tailwind

**Documentation:**
- `README.md` — first 50 lines only

**Structure:**
- Root directory list (do not recurse)

Extract from dependencies:
- Store: redux, zustand, pinia, vuex, mobx
- Router: react-router, vue-router, @tanstack/router
- UI: @mui, antd, element-plus, tailwindcss
- Test: jest, vitest, playwright, cypress

## Step 2: Present Detection Summary ⚠️ REQUIRED

Show user what was detected:
- Tech stack
- Package manager
- Node/runtime version
- Build / test / dev commands

Ask: "Is this correct? Should I proceed?"

⚠️ Do NOT proceed without user confirmation.

## Step 3: AskUserQuestion Four Questions ⚠️ REQUIRED

Ask in one call, pre-fill detected values:

1. **One-liner project description**: What does this project do in one sentence?
2. **Project type**: cli / web / library / service / other
3. **Main language and framework**: e.g., TypeScript + Next.js 14
4. **Special rules**: Forbidden directories, historical pitfalls, compatibility logic, or "none"

## Step 4: Confirm Overwrite Strategy ⚠️ REQUIRED

If `AGENTS.md` or `CLAUDE.md` already exists:
- Show current summary
- Ask: "Overwrite / Merge / Skip?"

⚠️ Do NOT overwrite without explicit user approval.

## Step 5: Generate AGENTS.md + CLAUDE.md

Fill `templates/AGENTS.md` with user answers and detection results.

Write to project root:
- `AGENTS.md`
- `CLAUDE.md` (one line: `@AGENTS.md`)

If `.tkt/company/` directory exists, keep the progressive disclosure section in `AGENTS.md`. If not, keep it as a placeholder comment.

## Step 6: Generate PostToolUse Hooks

If checkers were detected in Step 1, generate `.claude/settings.json` hooks.

Detection mapping:

| Detection | Tool | Hook Command |
|---|---|---|
| `package.json` has `eslint` | eslint | `npx eslint <file>` |
| `package.json` has `prettier` | prettier | `npx prettier --check <file>` |
| `tsconfig.json` exists | tsc | `npx tsc --noEmit` |
| `go.mod` + `golangci-lint` in deps | golangci-lint | `golangci-lint run <file>` |
| `pyproject.toml` has `ruff` | ruff | `ruff check <file>` |
| `pyproject.toml` has `mypy` | mypy | `mypy <file>` |
| `Cargo.toml` + `clippy` | clippy | `cargo clippy <file>` |

Only generate typecheck and lint hooks. Unit test / build / e2e are not hooked — they are triggered manually via `/tkt-verify`.

Ask user: "Generate hooks for detected checkers? (yes/no)"

If generated, remind user: "To disable a hook, remove the corresponding PostToolUse entry from `.claude/settings.json`."

⚠️ Do NOT write hooks without user approval.

## Step 7: Report Output

List created/modified files:
- `AGENTS.md`
- `CLAUDE.md`
- `.claude/settings.json` (if hooks generated)

Suggest next step: "Call /tkt-guide for workflow routing."

## Anti-Patterns

- Do NOT create `docs/` skeleton — docs are created by workflow triggers later.
- Do NOT install external skills or plugins — only suggest commands.
- Do NOT write encyclopedia-style AGENTS.md — keep it under 300 lines.
- Do NOT inline long documents — use conditional guidance like "For auth changes, read docs/auth-patterns.md".
- Do NOT guess commands — always confirm with user.

## Pre-Delivery Checklist

- [ ] AGENTS.md is under 300 lines
- [ ] All commands are exact syntax (e.g., `pnpm test src/xxx.test.ts`, not "run tests")
- [ ] No placeholder text remaining ({{xxx}}, TODO, FIXME)
- [ ] CLAUDE.md is exactly one line: `@AGENTS.md`
- [ ] If .tkt/company/ exists, progressive disclosure section is preserved
- [ ] User confirmed overwrite strategy before writing files
