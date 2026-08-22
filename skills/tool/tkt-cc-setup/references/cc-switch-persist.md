# cc-switch 为何冲掉底部栏

cc-switch 切 Claude 供应商时 **整份覆盖** `~/.claude/settings.json`。官方不打算改成字段合并（#1656 / #2133）。

供应商独有：`ANTHROPIC_BASE_URL` + `ANTHROPIC_AUTH_TOKEN` 或 `ANTHROPIC_API_KEY`。  
其余（`statusLine`、`enabledPlugins`、`hooks`、`theme`）应走 **通用配置**。

## 落盘位置

| 位置 | 作用 |
| --- | --- |
| `~/.claude/settings.json` | 当前生效。只改这里，下次切换就丢 |
| `~/.cc-switch/cc-switch.db` → `settings.common_config_claude` | 切换时写回 live 的共享片段 |
| `providers.settings_config`（app_type=claude） | 该供应商自己的整包；有 statusLine 的也要同步 |
| `~/.claude/settings.local.json`（user 级） | **不要当持久化**。盖不住 cc-switch 对 settings.json 的覆盖 |

GUI 等价操作：编辑供应商 → 通用配置 →「从当前供应商提取」；切换时勾选「写入通用配置」。本 skill 用 `apply.mjs` 直接写 db，避免只点 GUI 却提取到旧 `statusline.js`。

## 双 token

`ANTHROPIC_API_KEY` → `x-api-key`  
`ANTHROPIC_AUTH_TOKEN` → `Authorization: Bearer`  
两边同时有，Claude Code 警告且鉴权不确定。

常见：cc-switch 已清 User 注册表，但 **Cursor 启动时继承的旧 Kimi `API_KEY` 还在进程里**，settings 里是新供应商的 `AUTH_TOKEN`。修法：重启 Cursor，或在新终端清掉残留 `ANTHROPIC_*` 再开 `claude`。apply 不碰环境变量。

## 禁止

- 只提取一次通用配置却不去看 `statusLine.command`（可能把旧脚本固化进 db）
- 把 token 写进 skill / commit
