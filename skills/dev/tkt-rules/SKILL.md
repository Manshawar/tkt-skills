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
- TypeScript 项目：记下 `typescript` 与类型检查器版本（`vue-tsc` / `tsc`），供 Step 5/6 选型与版本判据；vue 项目类型检查必须 `vue-tsc`（裸 `tsc` 查不出 `.vue`），react/普通 ts 用 `tsc`

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

Fill `{{tsTypeCheckRules}}` (仅当检测到 TypeScript)：
- 非 TS 项目删除整节「类型/检查纪律」。
- TS 项目按检测到的事实写 3-5 条精简纪律，条目必须"AI 从代码猜不到"（版本兼容/遮蔽陷阱/别名双配），示例（按项目裁剪，勿照抄）：
  - vue-tsc/tsc 版本须与 typescript 兼容；老版本配新 TS 会崩或**假通过**（查不出 .vue/.tsx 内错），升级后再交付。验真查：往被查文件注入 `const x: number = 's'`，无报即失效。
  - 勿在 env.d.ts 对真实有类型库（vue/element-plus/pinia 等）写空/伪 `declare module` 遮蔽，会整片假错（TS2347/2339）；只给确无类型的库写兜底。框架自定义 meta/全局字段走官方扩展点，勿整体覆盖模块。
  - 全局实例属性（app.config.globalProperties 挂载）经 ComponentCustomProperties 增强在 vue-tsc 跨端不稳；优先组件库官方函数式 API（如 vant `showFailToast`）。
  - 多包复用（monorepo alias）须 tsconfig `paths` 与打包器 alias 双配一致，否则报 `Cannot find module`。

## Step 6: Generate PostToolUse Hooks

If checkers were detected in Step 1, generate `.claude/settings.json` hooks.

Detection mapping:

| Detection | Tool | Hook Command |
|---|---|---|
| `package.json` has `eslint` | eslint | `npx eslint <file>` |
| `package.json` has `prettier` | prettier | `npx prettier --check <file>` |
| `vue` in deps + `tsconfig.json` | vue-tsc | `npx vue-tsc --noEmit` |
| `tsconfig.json` exists (无 vue) | tsc | `npx tsc --noEmit` |
| `go.mod` + `golangci-lint` in deps | golangci-lint | `golangci-lint run <file>` |
| `pyproject.toml` has `ruff` | ruff | `ruff check <file>` |
| `pyproject.toml` has `mypy` | mypy | `mypy <file>` |
| `Cargo.toml` + `clippy` | clippy | `cargo clippy <file>` |

Only generate typecheck and lint hooks. Unit test / build / e2e are not hooked — they are triggered manually by change type (see tkt-guide workflow-verify).

> **Vue/TS 陷阱（先例 2026-09 web/mobile）**：
> - 裸 `tsc` 查不出 `.vue` SFC 内类型错，vue 项目必须用 `vue-tsc`。检查器版本须与 typescript 兼容（web 1.8.27 崩、mobile 0.29.8 假通过），配 TS5.x 至少 vue-tsc ≥2.1，推荐装与项目 TS 匹配的最新版。
> - **验"是否真查"**：生成后注入 `const x: number = 's'` 到一个 .vue，`npx vue-tsc --noEmit` 若 exit=0 无报 = 检查器没在查 SFC，须先修版本再交付。
> - Stop/PostToolUse 均属进程内 hook，无依赖时静默跳过，勿因"没跑"误判配置坏。

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
