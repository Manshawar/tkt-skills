# CCR 含图 Router 转发（备用方案，非 skill）

> **适用**：Claude Code + CCR，且**未**使用 Fusion MCP 识图，或临时切回纯文本主模型（如 `qax/deepseek-v4-flash`）仍需 `Read` 看图。  
> **默认不必启用**：主模型为 `Fusion/*` 时，看图走 `vision_understand` MCP，本规则通常不命中。  
> **Cursor**：IDE 侧多模态直连，不需要本文。

## 与 Fusion 的关系

| 路径 | 何时 |
| --- | --- |
| **Fusion MCP**（默认） | 主模型 `Fusion/deepseekflash&seed` 等，模型调 `vision_understand_*` |
| **本 Router 规则**（备用） | 非 Fusion + `Read` 产生 API body 内 `type:image` |

两条路互斥为主，不是层级包含。

## 规则形态

写入 `~/.claude-code-router/config.sqlite` → `Router.rules`，id 固定：

```json
{
  "id": "route-image-to-vision",
  "name": "image -> multimodal provider",
  "type": "condition",
  "enabled": true,
  "condition": {
    "left": "request.body.messages",
    "operator": "contains-deep",
    "right": "{\"type\":\"image\"}"
  },
  "target": "火山ARK/doubao-seed-2.1-turbo",
  "rewrite": {
    "key": "request.body.model",
    "operation": "set",
    "value": "火山ARK/doubao-seed-2.1-turbo"
  },
  "rewrites": [
    {
      "key": "request.body.model",
      "operation": "set",
      "value": "火山ARK/doubao-seed-2.1-turbo"
    }
  ]
}
```

删除 legacy id：`route-image-to-doubao`、任何 `alias-*` 含图别名。

## 重载

**禁止** `ccr start`（与 launchd 抢 3456）。

```bash
launchctl kickstart -k "gui/$(id -u)/com.manshawar.ccr"
```

label 以本机 `~/Library/LaunchAgents/com.*.ccr.plist` 为准。

## 踩坑

1. `enabled: false` → Read 仍走主模型  
2. target 用 `Provider/model` 全名，勿用 `fable` 短名  
3. 只有**含 image block 的那一跳**转发；后续纯文本追问仍在主模型  
4. UI 旁路 `[Image: path]` 文本不算；路由认 body  
5. shell `ANTHROPIC_AUTH_TOKEN` 会盖 WIF → 401  

## 验证

重开 `claude` 后 `Read` 真 PNG；CCR 请求日志 `resolved_model` 含目标模型。

## 停用

Fusion 稳定作默认时，将规则 `enabled: false` 或删除即可，无需维护 skill。
