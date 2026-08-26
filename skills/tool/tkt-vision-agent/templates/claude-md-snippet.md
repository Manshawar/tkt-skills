## Claude Code 视觉分工（tkt-vision-agent 维护）

> **仅 Claude Code + CCR/Fusion**。Cursor IDE 多模态直连，不适用本节；勿把 Fusion/子 agent 规则套到 Cursor。

主模型默认：`Fusion/deepseekflash&seed`（flash 写代码 + `vision_understand` MCP 识图，后端豆包 turbo）。

vision-analyst 模型：`{{VISION_MODEL}}`（大改 UI 时 sidechain 用，`apply --model` 可改）

### 默认路径

| 任务 | 谁做 |
| --- | --- |
| 识图、OCR、看报错、browser 截图、**轻量 UI**（1–2 处样式/小组件） | **主 agent** + Fusion **`vision_understand` MCP** |
| **大改 UI**（整页/多文件、≥3 轮看→改、设计稿还原） | **vision-analyst** 子 agent **一次**派发 → handoff |
| API、store、鉴权、算法 | **主 agent**（子 agent `Logic deferred to main`） |

### 何时派 vision-analyst（满足任一）

- 预计 ≥3 轮看→改→再看  
- 动 ≥3 个文件或整页级 layout  
- 主会话还需继续聊业务，不想 UI 细节污染上下文  

大任务**开场就派**，不要等主上下文脏了再补救。

### 铁律

1. **禁止** base64 / data URI 贴图 → Fusion MCP 或 `Read` + 绝对路径  
2. **不要**为单次识图 / 小改 UI 派 vision-analyst  
3. **不要**每张 browser 截图都派子 agent；browser 优先 snapshot/ref  
4. 子 agent 只改 template / style；逻辑回主 agent  

### 含图 Router 备用（通常不开）

非 Fusion、且必须 `Read` 直读图时，见 `tkt-skills/docs/ccr-image-route-backup.md`（手动写 CCR 规则，无 skill）。
