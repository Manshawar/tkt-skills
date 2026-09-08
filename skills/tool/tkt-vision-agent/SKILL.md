---
name: tkt-vision-agent
description: "视觉兜底 skill：当主模型非多模态(纯文本)或 Read 读图识别失败/读不准时，调用本 skill 起 vision-analyst 子 agent(glm-5.3-flash)读图；大改 UI(整页/多文件/多轮看→改 template·style)也用它。Actions: 识图兜底, 子agent, 读图失败, 图片识别, vision-analyst, 改UI派发, 视觉分工, 同步。Triggers: 当前模型识别不了图、图片识别失败、截图看不清、读图不准确、主模型不是多模态、大改UI派谁、/tkt-vision-agent。非触发: 主模型多模态且 Read 能读准时直读不触发；Cursor IDE 多模态不走本 skill。"
metadata:
  scope: global
---

# tkt-vision-agent

视觉兜底：主模型识别图片失败 / 主模型非多模态时，按需起 vision-analyst 子 agent(glm-5.3-flash)识图。大改 UI 也派它。

## IRON LAW

- **识图路径**：一律走 `Read` + 本地绝对路径原生 image message；**禁止** base64 / data URI 贴进 message
- **兜底触发**：主模型**非多模态**（纯文本，如 `deepseek-v4-flash`）→ 直接按需派 vision-analyst；主模型**多模态但 Read 识别失败/读不准**（答非所问、色值错、字编造）→ 派 vision-analyst 兜底重读
- **不常驻**：主模型能直读且读得准时（glm-5.3-flash）不派，主线程直接 Read
- 子 agent 只读图出文字结论 / 改 template·style·布局；逻辑回主 agent
- **高精度 UI 还原 / 整页 HTML 还原强制派 vision-analyst**，主 agent 禁止直做（见 memory `ui-restore-use-vision-analyst`）
- 换模型流程：**改正本 → 同步 → 重开 claude**

Red Flags:

- 把 CCR 含图规则写回本 skill（CCR 已弃用，2026-09 切 cc-switch 直连 aisg）
- 子 agent 改 script/API/store
- 主 agent 直接改 `~/.claude/agents/vision-analyst.md`（正本在 `agent/`）
- 模型名仍写 `qax/` 前缀或 `火山ARK/...`（直连后为**裸名**）
- 改完不重开就断言生效（env/agent 定义在进程启动时固化）

**产出**：本 skill `agent/vision-analyst.md`（正本）+ `~/.claude/agents/vision-analyst.md`（生效副本）。

## 何时调本 skill（判定）

| 场景 | 怎么做 |
| --- | --- |
| 主模型**非多模态**（纯文本，如 deepseek-v4-flash） | ✅ 识图就调本 skill，派 vision-analyst |
| 主模型多模态但 Read **识别失败/读不准** | ✅ 调本 skill 派 vision-analyst 兜底重读 |
| 主模型多模态且 Read 直读准确 | ❌ 不派，直接 Read |
| 高精度 UI 还原 / 整页 HTML 还原 | ✅ **强制派** vision-analyst |
| 多轮改 UI / 设计稿 / template+style | ✅ 派 vision-analyst |
| Cursor IDE 多模态 | ❌ 不走本 skill |

**现状（2026-09-08）**：主模型按用户随时切换，常在 `glm-5.3-flash`（多模态，直读）与 `deepseek-v4-flash`（纯文本，需兜底）之间。**不确定主模型能不能读图 → Read 一次试探**：解析出有效内容=多模态可直读；弹图失败/答非所问/空 = 视为非多模态，调本 skill 派子 agent。

## 识别链路细节

- **图片位置**：任意可读绝对路径即可（如 `/tmp/x.png`、`~/Desktop/x.png`）。勿用 `~/.claude/image-cache/`——临时缓存重开即清。
- **分辨率纪律（实测 2026-09-07）**：子 agent 链路有细节密度上限——**900px 图内 14px 级小字会糊、易读错/编造**（同字放大后能读对 = 投喂分辨率问题）。源图小字密 → 先放大关键区域/分段喂，勿整张密图硬读。
- 多图对比（如原型 vs 现页）→ 一次性把各图路径都给子 agent，让它逐张 Read 后对比。

## 模型选型（2026-09-07 双模型实测）

- **glm-5.3-flash（选定）**：忠实度高，逐字保留符号，读不出诚实标 `[看不清]`；色值/易混字/上下标更准。
- **deepseek-v4-flash-vision-exp**：大字零错但**小字/特殊符号自信脑补**（σ 编 `10¹²Ω`、`#E84393`→`#EB4393`）——UI 还原最忌编造，弃用。
- glm 走 Anthropic 有 `thinking` block，curl 直调需给 `thinking.budget_tokens` 否则 text 空；子 agent 链路正常。

## 文件布局

```
~/.claude/skills/tkt-vision-agent/
├── SKILL.md                  # 本文件
└── agent/vision-analyst.md   # 子 agent 正本（唯一改动点）
```

`~/.claude/agents/vision-analyst.md` 是正本 `agent/vision-analyst.md` 的**同步副本**，勿直接改。

## 换模型 / 改 agent 流程

1. **改正本** `agent/vision-analyst.md` 的 `model:`（或任何 frontmatter/内容）
2. **同步到生效副本**：
   ```bash
   cp ~/.claude/skills/tkt-vision-agent/agent/vision-analyst.md ~/.claude/agents/vision-analyst.md
   ```
3. **重开 claude** 生效（env/agent 定义在进程启动时固化，热改不生效）

## 坑（实测 2026-09）

1. **`CLAUDE_CODE_SUBAGENT_MODEL` env 会覆盖所有子 agent 的 frontmatter model**（优先级更高）。曾设 `deepseek-v4-pro` → 所有子 agent 请求 pro → aisg 403 `model not in allowlist`。查残留：`env | grep SUBAGENT`。
2. **模型名用裸名**（无 `qax/` 前缀——CCR 虚拟命名空间，已弃用）。带前缀会 model not found。
3. **`image-cache/` 是临时缓存**，重开即清；测试图放 `/tmp/` 或持久路径。
4. 网关白名单外模型直接 403；改配置后**重开**才生效（进程 env 快照固化）。

## 验证

同步后确认生效副本与正本一致：

```bash
diff ~/.claude/skills/tkt-vision-agent/agent/vision-analyst.md ~/.claude/agents/vision-analyst.md && echo OK
```

功能验证：派 vision-analyst 读一张**内容已知**的图（如 `/tmp/test_img.png`），核对返回与真值逐字段一致。

## 新电脑初始化

1. 装 skill：`npx skills add Manshawar/tkt-skills -g --skill tkt-vision-agent`
2. 同步正本到生效位置 + 重开：
   ```bash
   cp ~/.claude/skills/tkt-vision-agent/agent/*.md ~/.claude/agents/
   ```

`npx skills update` 拉新正本到 skill 目录，但**不会**自动覆盖 `~/.claude/agents/`——更新后按「换模型/改 agent 流程」同步一次。
