# HUD 人民币 + 供应商用量

`~/.claude/plugins/claude-hud/statusline.mjs` 是启动器，**不要**改插件 cache 里的 dist（升级会丢）。

## 费用：官网价优先，否则 Anthropic 估价×汇率

1. **官网等价（优先）**：`usage/session-cost.cjs` 读当前会话 transcript 的 token，按厂家价表算人民币。DeepSeek 价表在 `usage/pricing/deepseek.cjs`（官网 元/百万 token，北京时间峰谷）。对得上 `deepseek-v4-flash` / `deepseek-v4-pro` 时，用这个数替换 HUD 的 `$`。
2. **对不上价表**（官方 Claude / 未录入模型）：退回 HUD 自带 Anthropic 美元估价，再按汇率改 `¥`。

DeepSeek 官网（2026-08-17）：高峰 9:00–12:00、14:00–18:00（北京），空闲半价。按**每条消息时间戳**选峰/闲，不是整段用「现在」。

火山 **Coding Plan 按次数套餐扣**，官网 token 价是**等价参考**，不是账单。账单看底部用量行。

价变：改 `pricing/*.cjs` 里的表，不要每 5s 抓官网。新厂家加 `pricing/<vendor>.cjs` + 在 `session-cost.cjs` 里 resolve。

汇率兜底（仅无官网价时）:

1. `CLAUDE_HUD_USD_CNY`
2. `hud-local.json` 的 `usdCny`（默认 7.2）

apply **不会覆盖**已有 `hud-local.json`。

## 底部用量行

启动器在 HUD 后再跑 `usage/index.cjs`。按 `ANTHROPIC_BASE_URL` 选厂家，**只用当前这一家**，打在最底一行。

| 厂家 | 文件 | 匹配 | 数据源 |
| --- | --- | --- | --- |
| 火山 | `usage/vendors/volcengine.cjs` | `volces.com` / `ark.cn-beijing` | `arkcli plans get` + `arkcli usage plan --product coding-plan` |

新厂家：在 `vendors/` 加 `{ id, match(url), fetchLine() }` 的 `.cjs`。index 会自动加载。

结果缓存 `usage-cache/<id>.json`，默认 60s（`hud-local.json.usageTtlSec` / `CLAUDE_HUD_USAGE_TTL_SEC`）。statusLine 每 5s 刷新，不要每次打 arkcli。

arkcli 必须走 **nvm 真实目录**（`realpath(node.exe)` 旁的 `arkcli.cmd`），不能走 `C:\nvm4w\nodejs` 符号链接，否则会 `update_execution_boundary` 直接失败、底部无用量行。可用 `ARKCLI_BIN` 覆盖。未登录则用量行空。

## 禁止

- 重跑 `/claude-hud:setup`（会重写启动器，CNY/用量/extra-cmd 全丢）
- 改 `plugins/cache/**/dist/cost.js` 换货币
- 把 arkcli 输出的完整账号 JSON 打进聊天
