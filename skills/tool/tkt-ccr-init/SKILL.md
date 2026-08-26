---
name: tkt-ccr-init
description: "Claude Code Router(CCR) 新电脑/重装基础设施初始化与踩坑修复。launchd 3456、settings↔cc-switch 同步、api-key-helper、proxy=none、主模型全名、Provider contextWindow。不含含图 Router。Actions: 初始化CCR, doctor, apply, 401, 502, Not logged in, launchd。Objects: claude-code-router, config.sqlite, 3456, apiKeyHelper, WIF, cc-switch。Triggers: 初始化CCR, 新电脑配CCR, CCR连不上, 502 upstream, Not logged in, ccr start冲突, 配claude code router, /tkt-ccr-init。非触发: 含图转发→tkt-ccr-image-route; vision子agent→tkt-vision-agent; HUD→tkt-cc-setup。"
argument-hint: "[doctor|apply] [--main-model Provider/model] [--context-tokens N] [--dry-run]"
metadata:
  scope: global
---

# tkt-ccr-init

IRON LAW:

- **禁止 `ccr start`** 与 launchd 抢 3456
- **禁止**只改 `settings.json` 不写 cc-switch `common_config_claude`
- **禁止** `settings.model` 用 `fable`/`haiku`/`sonnet`/`opus` 短名
- **禁止** shell 残留 `ANTHROPIC_AUTH_TOKEN` 盖 WIF
- **禁止**输出完整 API key / WIF
- apply 后让用户 **退出并重开 `claude`**

Red Flags（出现就停，回 Step 1）:

- 跑了 `ccr start`
- 手改 JSON 不跑 doctor/apply
- 把含图 Router 或 vision-analyst 写进 init

**范围**：CCR 基础设施 only。含图转发 → `tkt-ccr-image-route`；vision 子 agent → `tkt-vision-agent`；HUD → `tkt-cc-setup`。

## 模式

| 用户说法 | 做什么 |
| --- | --- |
| 新电脑 / 初始化 CCR | Step 0→1→3→4→5→6 |
| 401 / 502 / Not logged in | Step 1→2，用户要修再 4→5 |
| 只排查 | `doctor.mjs` |
| `$ARGUMENTS` 含 `apply` | 按脚本 apply |

## Workflow

```
tkt-ccr-init Progress:

- [ ] Step 0: CCR 已装 + Providers 已在 UI 配好 ⛔ BLOCKING
- [ ] Step 1: 跑 doctor ⚠️ REQUIRED
- [ ] Step 2: 对现象（fail/warn 时 Load references/pitfalls.md）
- [ ] Step 3: 问主模型 Provider/model + context ⚠️ REQUIRED（init）
- [ ] Step 4: 确认 apply 清单 ⚠️ REQUIRED
- [ ] Step 5: apply（先 --dry-run）
- [ ] Step 6: 重开 claude + 验证 3456
```

## Step 0 ⛔ BLOCKING

1. 安装 `@musistudio/claude-code-router`
2. CCR UI 配 **Providers / API Key**
3. launchd 或登录时启动 — 细节 Load `references/launchd.md`
4. cc-switch 已装（若用 cc-switch）

不在 CCR UI 替用户创 Provider。

## Step 1: doctor

**在本 skill 目录**：

```bash
node --experimental-sqlite scripts/doctor.mjs
node --experimental-sqlite scripts/doctor.mjs --model 'qax/deepseek-v4-flash'
```

| id | fail/warn 常见原因 |
| --- | --- |
| `ccr_port_listen` | launchd 未起 |
| `ccr_start_conflict` | 误跑 `ccr start` |
| `proxy_upstream` | `system` + Clash 未起 |
| `settings_model` | 短名 fable 等 |
| `api_key_helper` | helper 缺失 |
| `common_model_drift` | cc-switch 与 live 不一致 |

## Step 2: 对现象

| 现象 | 动作 |
| --- | --- |
| EADDRINUSE 3456 | Load `references/launchd.md` |
| 502 | apply 改 proxy→none |
| 401 / Not logged in | Load `references/pitfalls.md` §鉴权 |
| 切换丢配置 | Load `references/cc-switch-sync.md` |

## Step 3 ⚠️ REQUIRED

Ask: 主会话 `Provider/model`？context tokens？（默认 1000000）

## Step 4 ⚠️ REQUIRED

将改：proxy→none；Provider contextWindow；settings+cc-switch 同步 BASE_URL/auth/helper/model；kickstart launchd。

**不改**含图 Router / vision-analyst。

用户说「初始化/apply/修」= 同意。只问「为什么」= 停。

## Step 5: apply

```bash
node --experimental-sqlite scripts/apply.mjs --dry-run \
  --main-model 'qax/deepseek-v4-flash' --context-tokens 1000000
node --experimental-sqlite scripts/apply.mjs \
  --main-model 'qax/deepseek-v4-flash' --context-tokens 1000000
```

| 意图 |  flags |
| --- | --- |
| 只修 settings/cc-switch | `--skip-ccr` |
| 只修 CCR proxy/context | `--skip-settings` |

再跑 doctor，fail=0。

## Step 6

1. 重开 `claude`
2. `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3456/` ≠ 000
3. 按需：`tkt-ccr-image-route` / `tkt-vision-agent`

## Anti-Patterns

- `ccr start` 测 CCR
- init 加 fable 别名路由
- 只改 settings 不 sync cc-switch
- 把 vision/含图写进 init

## Pre-Delivery Checklist

- [ ] doctor 已跑，fail 已处理
- [ ] init 时有主模型全名
- [ ] 未 `ccr start`、无完整 secret
- [ ] 用户已重开 claude
- [ ] 含图/vision 需求已指向对应 skill（若相关）

## 安装

```bash
npx skills add Manshawar/tkt-skills -g --skill tkt-ccr-init
```
