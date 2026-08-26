---
name: tkt-ccr-image-route
description: "CCR 含图请求转发：主供应商不支持多模态时，Read 图片自动 rewrite 到另一 Provider/model。只写 Router.rules route-image-to-vision。Actions: 含图路由, 读图转发, 换多模态, doctor, apply。Triggers: 含图走豆包, 读图路由, 主模型不能看图, 换含图模型, 图片识别转发, /tkt-ccr-image-route。非触发: 初始化CCR→tkt-ccr-init; vision子agent/改UI→tkt-vision-agent; 401/502→tkt-ccr-init。"
argument-hint: "[doctor|apply] [--model Provider/model] [--dry-run]"
metadata:
  scope: global
---

# tkt-ccr-image-route

IRON LAW:

- **只写** CCR `Router.rules` id=`route-image-to-vision`
- **禁止** `ccr start`；重载用 `launchctl kickstart`
- **禁止** target 用 fable/haiku/sonnet/opus 短名
- **禁止** 输出完整 API key
- **不**装 vision-analyst、**不**改 CLAUDE.md

Red Flags:

- 主模型已能多模态仍写规则
- 为多轮改 UI 派本 skill（应 `tkt-vision-agent`）
- 未 `--dry-run` 直接 apply

## 何时用

| 场景 | 本 skill |
| --- | --- |
| 主供应商**不能**多模态 + 单次 Read 识图 | ✅ |
| 主模型已能看图 | ❌ |
| 多轮改 UI | ❌ → `tkt-vision-agent` |
| CCR 401/502/新电脑 | ❌ → `tkt-ccr-init` |

## Workflow

```
tkt-ccr-image-route Progress:

- [ ] Step 1: 确认主供应商不能看图；目标 model 已在 CCR Providers ⚠️ REQUIRED
- [ ] Step 2: doctor --model ⚠️ REQUIRED
- [ ] Step 3: 确认 rewrite 目标 ⚠️ REQUIRED
- [ ] Step 4: apply --dry-run 再 apply
- [ ] Step 5: 重开 claude；Read 真 PNG 验证
```

## Step 1 ⚠️ REQUIRED

Ask: 含图请求 rewrite 到哪个 `Provider/model`？（须在 CCR Providers 已存在）

主模型已多模态 → **停**，不必 apply。

## Step 2: doctor

**在本 skill 目录**：

```bash
node --experimental-sqlite scripts/doctor.mjs --model 'Provider/model'
```

`image_rule` fail / `provider_model` fail → Load `references/pitfalls.md`

## Step 3 ⚠️ REQUIRED

将 upsert：`route-image-to-vision`，`enabled: true`，`contains-deep` `{"type":"image"}`，删 legacy `route-image-to-doubao`，kickstart launchd。

用户说「配上/apply/含图走XX」= 同意。

## Step 4: apply

```bash
node --experimental-sqlite scripts/apply.mjs --model 'Provider/model' --dry-run
node --experimental-sqlite scripts/apply.mjs --model 'Provider/model'
```

## Step 5

1. 重开 `claude`
2. Read 真 PNG；CCR 日志 `resolved_model` 含目标

边界 Load `references/wire-format.md`（仅解析失败时）。

## Anti-Patterns

- 每张 browser 截图都改 Router
- 用 1×1 PNG 当 apply 失败证据
- 手改 rules JSON 不跑脚本

## Pre-Delivery Checklist

- [ ] 用户给了 `Provider/model` 且在 Providers
- [ ] doctor `image_rule` ok
- [ ] 未 `ccr start`、无完整 secret
- [ ] 用户已重开 claude

## 相关

- `tkt-ccr-init` — 前置基础设施
- `tkt-vision-agent` — UI 子 agent（解耦）

## 安装

```bash
npx skills add Manshawar/tkt-skills -g --skill tkt-ccr-image-route
```
