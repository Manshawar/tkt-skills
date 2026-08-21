---
name: tkt-e2e-init
description: "Initialize AI visual regression testing (Midscene + Playwright) in a project. Detect project reality first — monorepo vs single frontend, multiple web apps, real dev port, login/auth state, route guards, backend dependencies — then generate an isolated e2e/ test sub-project that never pollutes the main project. Use when user says 'init e2e test', 'add visual regression testing', 'setup Midscene', 'add UI regression test', '初始化 e2e', '给项目加视觉回归测试', '配 Midscene', '搭 e2e 测试', or invokes /tkt-e2e-init. Triggers: e2e, visual regression, midscene, playwright, UI test, regression test, init test, test scaffold, browser test."
metadata:
  scope: project
---

# tkt-e2e-init

IRON LAW: Detect project reality BEFORE generating anything. Never emit a generic scaffold — no hardcoded ports, no single-frontend assumption, no test that ignores login/route guards. **端口必须与被测项目对应**:读 config 端口只是起点,必须验证该端口上跑的服务确属被测前端,不能只读端口就写死。

## Workflow

Copy this checklist and check off items as you complete them:

```
tkt-e2e-init Progress:

- [ ] Step 1: Detect project structure ⚠️ REQUIRED
- [ ] Step 2: Detect runtime dependencies ⚠️ REQUIRED
- [ ] Step 3: Present findings + confirm scope ⚠️ REQUIRED
- [ ] Step 4: Generate isolated e2e/ sub-project
- [ ] Step 5: Guide install + first green run
```

## Step 1: Detect Project Structure ⚠️ REQUIRED

Load `references/project-detection.md` and answer these questions from the actual filesystem (never guess):

1. **Monorepo or single frontend?** Root has no `package.json` but has subdirs with their own → monorepo. Each frontend subdir is one Playwright project.
2. **How many web apps?** `web/`, `mobile/`, `app/`, `admin/` … each with its own dev script + port. Test one or several — do not assume one.
3. **Real dev port of each?** Read the config, don't guess: `vite.config.ts` `server.port`, `next.config`, `webpack` devServer, or CLI `--port` in the script.
4. **Start command of each?** Read the subdir's `package.json` `scripts` (`dev`/`serve`/`start`), note the exact manager (`pnpm`/`npm`/`yarn`).

## Step 2: Detect Runtime Dependencies ⚠️ REQUIRED

Ask: "What will make the first run fail?" Look for:

1. **Login/auth**: router interceptor, auth guard, `beforeEach`, storage keys (`sessionStorage`/`localStorage`), pinia/vuex persist. If the page requires login, the scaffold MUST inject auth state — otherwise first run is red.
2. **Route guards**: dynamic role-based routes, `role-router`/`router-interceptor`-style files, unauthenticated redirects. Note where the target page is registered.
3. **Backend dependency**: does the page call a real API? Find the backend port; the spec needs a probe-and-skip or mock.

## Step 3: Present Findings + Confirm Scope ⚠️ REQUIRED

Show the user what was detected, then ask:

- Which frontend(s) to test?
- Auth: inject fake state (show the exact storage key/format), or is there a test login?
- Backend: skip when down, or mock?

⚠️ Do NOT write any file before the user confirms scope.

## Step 4: Generate Isolated e2e/ Sub-Project

Load `references/e2e-scaffold.md` for the exact file list, generation rules, and templates.

Hard rules:

- Isolated: `e2e/` has its own `package.json` + `node_modules`; never touch the main project's dependencies.
- Config reflects reality: `projects: [...]` per frontend, `webServer.cwd` = frontend subdir, `baseURL` = detected port.
- Spec skeleton encodes the detected runtime: auth injection, route target, backend probe — not a generic "title is visible" assertion.
- 设置 commit hook 冒烟:Load `references/smoke-hook.md`,按模板生成 `.claude/hooks/check-commit.sh` + 配 `.claude/settings.json` 的 PreToolUse hook(冒烟=diff 选例,Claude 提交触发,手动 git commit 不触发)。

Append ignore rules to the project root `.gitignore`: `e2e/node_modules/`, `e2e/.env`, `e2e/test-results*`, `e2e/playwright-report/`, `e2e/midscene_run/`.

## Step 5: Guide Install + First Green Run

Output exact commands (do not run them yourself):

```
pnpm --dir <project>/e2e install
pnpm --dir <project>/e2e exec playwright install chromium
pnpm --dir <project>/e2e exec playwright test
```

Midscene model config: 用户自己填 `e2e/.env`,不依赖任何既有 CLI。先问用户模型服务商,再输出模板让用户填四项:

```
MIDSCENE_MODEL_BASE_URL=<base_url>
MIDSCENE_MODEL_API_KEY=<api_key>
MIDSCENE_MODEL_NAME=<model_name>
MIDSCENE_MODEL_FAMILY=<family>
```

`MIDSCENE_MODEL_FAMILY` 按服务商填(openai/anthropic/google 等),与 `MODEL_NAME` 不对应时单独调整。值从模型服务商控制台获取。

## Anti-Patterns

- Do NOT hardcode `http://localhost:5173` — read the real port.
- Do NOT assume single frontend in a monorepo — detect `projects: [...]`.
- Do NOT emit a generic spec when the page needs login — inject auth or the run is red from the start.
- Do NOT run install/test yourself — output commands for the user.
- Do NOT reuse an existing dev server on a port without verifying it belongs to the project — `reuseExistingServer: true` reuses ANY service listening on that port; if another project occupies it, tests run against the wrong page (e.g. toolkit's 5173 was taken by zcode mobile, e2e ran against zcode's login page). Verify ownership before reusing.
- Do NOT hardcode project-specific auth/storage values in this skill — detect them from the project; private/company values live in the project's local knowledge base, never in this public skill.

## Pre-Delivery Checklist

- [ ] Every `baseURL` and `webServer.cwd` comes from detected config, not a default
- [ ] `projects` array covers each frontend the user chose (or single config for single app)
- [ ] Spec encodes auth injection / route target / backend probe if detected
- [ ] `.gitignore` appended with e2e artifact paths
- [ ] 冒烟 hook 已设置:`.claude/hooks/check-commit.sh` + `.claude/settings.json` PreToolUse(选例靠 cases.json files)
- [ ] `cases.json` 已生成(必选):每个 spec 用例名都有分组/优先级/files 登记(平台靠它分组触发 + diff 选例)
- [ ] `e2e/.env` 四项 MIDSCENE_MODEL_* 由用户自填(不拷贝既有 CLI,无 `<...>` 占位符残留)
- [ ] No placeholder text (`TODO`, `{{xxx}}`) remains in generated files
- [ ] Install/test commands are exact syntax for the detected package manager
