---
name: tkt-sso-test
description: "Initialize AI visual regression testing for a deployed web page behind a corporate SSO login. Detect the real login chain first — login page URL, test account source, post-login redirect (login → click entry → platform injects code → redirect to target) — then generate an isolated e2e/ sub-project that tests the online page as-is, with NO client-runtime mocking. Use when user says '线上测试', 'SSO 测试', '真实登录测试', '黑盒测试', '部署页面测试', '线上回归', or invokes /tkt-sso-test. Triggers: sso, online test, deployed page, blackbox test, real login, webview, 线上回归, 真实登录, 黑盒测试, SSO, 部署页面."
metadata:
  scope: project
---

# tkt-sso-test

IRON LAW: Real login, never mock. The page runs at a deployed online URL — there is no local dev server, no port. Test via the real SSO chain in a browser; never inject a fake token, never mock the client runtime (injected js-sdk / native bridge). Client-only features are out of scope: mark them, don't fake them.

## Workflow

Copy this checklist and check off items as you complete them:

```
tkt-sso-test Progress:

- [ ] Step 1: Confirm online target ⚠️ REQUIRED
- [ ] Step 2: Map the SSO login chain ⚠️ REQUIRED
- [ ] Step 3: Present findings + confirm scope ⚠️ REQUIRED
- [ ] Step 4: Generate isolated e2e/ sub-project
- [ ] Step 5: Guide install + first green run
```

## Step 1: Confirm Online Target ⚠️ REQUIRED

Ask user for:

1. **Online URL of the page under test** — from admin/ops, never guessed (no local port, no dev server).
2. **Where the page is consumed** — e.g. inside an enterprise IM client's WebView (a separately deployed web page). Confirms we test the web page itself, not the container.

## Step 2: Map the SSO Login Chain ⚠️ REQUIRED

Login is NOT mocked — the spec walks the real chain. Ask for four facts:

1. **Login page URL**: the admin/login page (may be a different origin from the target page).
2. **Test account source**: obtain a test account from admin; keep credentials in project-local `.env`, never in this skill or committed files.
3. **Post-login redirect chain**: e.g. login succeeds → click an "enter console" element → the platform injects a code → auto-redirect to the actual page. Playwright follows these real steps.
4. **Client-only dependencies (optional)**: does the page rely on capabilities present only in the client/WebView runtime (e.g. an injected js-sdk)? If yes → mark as "not coverable on web", do NOT mock, do NOT test.

## Step 3: Present Findings + Confirm Scope ⚠️ REQUIRED

Show what was mapped, then ask:

- Which pages to test (just the target page, or more)?
- Test account ready (credentials to `.env`)?
- Confirm **read-only constraint**: no destructive assertions on the live environment.

⚠️ Do NOT write any file before the user confirms scope.

## Step 4: Generate Isolated e2e/ Sub-Project

Load `references/sso-auth.md` for templates: `playwright.config.ts` (baseURL = online URL, no `webServer`, `storageState`), `auth.setup.ts` (real SSO login → save state), business spec (reuse state + Midscene visual assertions), `.env` template.

Hard rules:

- Isolated: `e2e/` has its own `package.json` + `node_modules`; never touch the main project's dependencies.
- No `webServer` — the page is already running online.
- Spec is **read-only** (no submit / delete / db-write). Write-operation cases are marked P2 and skipped by default; run manually after human confirmation.

Append ignore rules to the project root `.gitignore`: `e2e/node_modules/`, `e2e/.env`, `e2e/test-results*`, `e2e/playwright-report/`, `e2e/midscene_run/`.

## Step 5: Guide Install + First Green Run

Output exact commands (do not run them yourself):

```
pnpm --dir <project>/e2e install
pnpm --dir <project>/e2e exec playwright install chromium
pnpm --dir <project>/e2e exec playwright test
```

## Anti-Patterns

- Do NOT mock the client runtime (injected js-sdk / native bridge) to test web features — walk the real SSO login; client-only features are marked "not coverable", not faked.
- Do NOT inject a fake token instead of walking the real login chain.
- Do NOT hardcode credentials or page-specific selectors in this skill — they live in the project's local `.env` / knowledge base, never in this public skill.
- Do NOT write destructive assertions in online mode — read-only, no side effects.
- Do NOT run install/test yourself — output commands for the user.
- Do NOT guess the online URL — get it from admin/ops.

## Pre-Delivery Checklist

- [ ] Online URL obtained from admin/ops (not guessed), no `webServer`
- [ ] SSO login chain mapped: login page / test account / post-login redirect
- [ ] Login walks the real SSO chain, not a fake token
- [ ] Client-only dependencies marked as "not coverable on web"
- [ ] `.env` holds credentials (project-local, not committed)
- [ ] No placeholder text (`TODO`, `{{xxx}}`) remains in generated files
- [ ] Install/test commands are exact syntax for the detected package manager
