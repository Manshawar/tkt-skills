---
name: tkt-vision-agent
description: "管理视觉子 agent（vision-analyst，大改 UI sidechain）与视觉分工。正本在本 skill 的 agent/ 目录，发布用 cp 同步。仅 Claude Code。Actions: 装子agent, 视觉子agent, vision-analyst, 改UI派发, 视觉分工, 同步。Triggers: 装vision agent, 换视觉子agent模型, 大改UI派谁, 页面视觉分工, vision-analyst, /tkt-vision-agent。非触发: CCR初始化→tkt-ccr-init; 含图Router备用→references/ccr-image-route-backup.md; Cursor IDE 多模态不走本 skill。"
metadata:
  scope: global
---

# tkt-vision-agent

IRON LAW:

- **不**写 CCR Router（备用见 `references/ccr-image-route-backup.md`）
- **禁止** base64 / data URI 贴图；Fusion 用 `vision_understand` MCP，或 Read + 绝对路径
- **禁止**单次识图 / 轻量 UI 派 vision-analyst（主 agent + Fusion MCP）
- 子 agent 只改 template / style / 布局；逻辑回主 agent
- 换模型流程：**改正本 → 同步 → 重开 claude**（见下）

Red Flags:

- 把 CCR 含图规则写进本 skill
- 主模型已多模态仍强制派子 agent 做单次 OCR
- 子 agent 改 script/API/store
- 主 agent 直接改 `~/.claude/agents/vision-analyst.md`（正本在 `agent/`）

**产出**：本 skill `agent/vision-analyst.md`（正本）+ `~/.claude/agents/vision-analyst.md`（生效副本）。

## 何时用

| 场景 | 本 skill |
| --- | --- |
| 首次装 / 换 vision-analyst 模型 | ✅ |
| 多轮改 UI / 设计稿 / template+style | ✅（装好后由 agent 定义分流，无需本 skill） |
| 单次识图 / 轻量 UI | ❌ 主 agent + Fusion `vision_understand` MCP |

## 文件布局

```
skills/tool/tkt-vision-agent/
├── SKILL.md                  # 本文件
├── agent/vision-analyst.md   # 子 agent 正本（唯一改动点）
└── references/               # 备用文档
```

`~/.claude/agents/vision-analyst.md` 是正本 `agent/vision-analyst.md` 的**同步副本**，勿直接改。

## 换模型 / 改 agent 流程

1. **改正本** `agent/vision-analyst.md` 的 `model:`（或任何 frontmatter/内容）
2. **同步到生效副本**：
   ```bash
   cp skills/tool/tkt-vision-agent/agent/vision-analyst.md ~/.claude/agents/vision-analyst.md
   ```
   （`agent/` 还有别的文件时，可 `cp agent/*.md ~/.claude/agents/`）
3. **重开 claude** 生效

## Step 1（换模型前，可选）

读取 `~/.claude/agents/vision-analyst.md` 的 `model:` 确认当前值。不存在或用户明确要换，问「子 agent 默认 `Provider/model`？」（例 `火山ARK/doubao-seed-2.1-turbo`）。

## 验证

同步后确认生效副本的 `model:` 与正本一致：

```bash
diff skills/tool/tkt-vision-agent/agent/vision-analyst.md ~/.claude/agents/vision-analyst.md && echo OK
```

## 新电脑初始化（安装即激活 UI 还原工作流）

本 skill 的 `agent/` 目录是 vision-analyst 子 agent 的**跨机器分发正本**——它定义了「多模态模型派做 UI 还原/大改 UI」的工作流。新电脑只需两步，无需再跑任何安装脚本：

1. 装 skill：`npx skills add Manshawar/tkt-skills -g --skill tkt-vision-agent`
2. 同步正本到生效位置：

   ```bash
   cp ~/.claude/skills/tkt-vision-agent/agent/*.md ~/.claude/agents/
   ```

3. 重开 claude。

之后派 vision-analyst 子 agent，即走 `agent/vision-analyst.md` 定义的 UI 还原工作流（多模态模型 + 铁律 + handoff `Logic deferred to main`）。

## 安装

```bash
npx skills add Manshawar/tkt-skills -g --skill tkt-vision-agent
```

`npx skills update` 会拉新正本到 `~/.claude/skills/tkt-vision-agent/agent/`，但**不会**自动覆盖 `~/.claude/agents/` —— 更新后按「换模型/改 agent 流程」同步一次（同上面「新电脑初始化」第 2 步的 `cp`）。
