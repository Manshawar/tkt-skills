---
name: tkt-vision-agent
description: "安装 vision-analyst 子 agent + 写入 CLAUDE.md 视觉分工（template/style 归子 agent，逻辑归主 agent）。与 CCR 无强绑定。Actions: 装子agent, 视觉分工, vision-analyst, 改UI派发, doctor, apply。Triggers: 装vision agent, 视觉子agent, 改UI子agent, 页面视觉分工, vision-analyst, /tkt-vision-agent。非触发: 含图CCR转发→tkt-ccr-image-route; CCR初始化→tkt-ccr-init; 单次识图且主模型不能看图→先 tkt-ccr-image-route 或换主模型。"
argument-hint: "[doctor|apply] [--model Provider/model] [--dry-run] [--skip-agent|--skip-claude-md]"
metadata:
  scope: global
---

# tkt-vision-agent

IRON LAW:

- **不**写 CCR Router（`tkt-ccr-image-route`）
- **禁止** base64 / data URI 贴图；只用 Read + 绝对路径
- **禁止**单次识图派 vision-analyst（主 agent Read 或 CCR 转发）
- apply 后 **重开 claude**

Red Flags:

- 把 CCR 含图规则写进本 apply
- 主模型已多模态仍强制派子 agent 做单次 OCR
- 子 agent 改 script/API/store

**产出**：`~/.claude/agents/vision-analyst.md` + `CLAUDE.md` 中 `<!-- tkt-vision-agent:begin -->` 块。

## 何时用

| 场景 | 本 skill |
| --- | --- |
| 多轮改 UI / 设计稿 / template+style | ✅ |
| 单次识图 OCR | ❌ 主 Read；不能看图 → `tkt-ccr-image-route` |
| 逻辑 / API / store | ❌ 主 agent |

## Workflow

```
tkt-vision-agent Progress:

- [ ] Step 1: 问 vision-analyst 的 Provider/model ⚠️ REQUIRED
- [ ] Step 2: doctor --model ⚠️ REQUIRED
- [ ] Step 3: 确认将写 agent + CLAUDE.md ⚠️ REQUIRED
- [ ] Step 4: apply --dry-run 再 apply
- [ ] Step 5: 重开 claude
```

## Step 1 ⚠️ REQUIRED

Ask: 子 agent 默认 `Provider/model`？（例 `火山ARK/doubao-seed-2.1-turbo`）

## Step 2: doctor

**在本 skill 目录**：

```bash
node scripts/doctor.mjs --model 'Provider/model'
```

## Step 3 ⚠️ REQUIRED

将写/覆盖：agent frontmatter `model:`；CLAUDE.md marker 块（含分工表 + 禁止 base64 + Logic deferred）。

用户说「装 vision agent / apply」= 同意。

## Step 4: apply

```bash
node scripts/apply.mjs --model 'Provider/model' --dry-run
node scripts/apply.mjs --model 'Provider/model'
# 只更新 agent：
node scripts/apply.mjs --model 'Provider/model' --skip-claude-md
```

## Step 5

重开 `claude`。测：派 vision-analyst 改一页 UI，handoff 含 `Logic deferred to main`。

## Anti-Patterns

- 每张截图派子 agent
- 子 agent 写平行整页 HTML
- 与 `tkt-ccr-image-route` 混在一次 apply

## Pre-Delivery Checklist

- [ ] 用户给了 `Provider/model`
- [ ] doctor `vision_agent` + `claude_md_snippet` ok
- [ ] 用户已重开 claude
- [ ] 单次识图需求已指向主 Read / `tkt-ccr-image-route`（若相关）

## 相关

- `tkt-ccr-image-route` — 主供应商无多模态时的含图转发（可选）
- `tkt-ccr-init` — CCR 基础设施（可选）

## 安装

```bash
npx skills add Manshawar/tkt-skills -g --skill tkt-vision-agent
```
