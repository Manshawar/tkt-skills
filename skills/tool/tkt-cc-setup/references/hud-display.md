# HUD 人民币 + 供应商用量

`~/.claude/plugins/claude-hud/statusline.mjs` 是启动器，**不要**改插件 cache 里的 dist（升级会丢）。

问费用 / 官网对照 / 套餐值多少 / 百分比对不上 → 先读本文件，再改 `scripts/hud/`。

## 两套账，不要混

| HUD | 含义 | 不是 |
| --- | --- | --- |
| `Cost 官网¥` | 本会话 token × [DeepSeek 官网按量价](https://api-docs.deepseek.com/zh-cn/quick_start/pricing) | Coding Plan 扣费 |
| 底行 `火山 LITE ⚠5h x% …` | 套餐请求次数用量（控制台同口径） | token 账单 |

Coding Plan **按请求次数**包月；官网 **按 token**。`官网¥` 只回答「同样用量走 DeepSeek 按量要多少」。

## 官网价表（2026-08-17，元 / 百万 token）

高峰：北京 9:00–12:00、14:00–18:00（半开区间，`12:00`/`18:00` 算空闲）。其余半价。按**每条消息时间戳**选峰/闲。

| | flash / flash-vision-exp 闲/峰 | pro 闲/峰 |
| --- | --- | --- |
| 命中 | 0.05 / 0.10 | 0.15 / 0.30 |
| 未命中 | 1.5 / 3.0 | 4.5 / 9.0 |
| 输出 | 4.5 / 9.0 | 13.5 / 27.0 |

token 映射：`cache_read` = 命中；`input` + `cache_write` = 未命中；`output` = 输出（含思考）。  
按 transcript 的 `message.model` 选 flash/pro，不要信 settings 里的 `haiku`。  
价变：改 `usage/pricing/deepseek.cjs`，不要每 5s 抓网页。

对不上价表（官方 Claude / 未录入模型）：退回 HUD 的 Anthropic `$` × 汇率（`CLAUDE_HUD_USD_CNY` / `hud-local.json.usdCny`，默认 7.2）。apply **不覆盖**已有 `hud-local.json`。

## 计费两个已踩坑

1. **同一 `message.id` 只计一次。** Claude 会把一次 API 回复写成 2–3 行 jsonl（thinking/text/tool），`usage` 相同。按行累加会把 `官网¥` 放大约 2–3 倍（Tokens 行 HUD 已去重，费用必须同样去重）。实现：`usage/session-cost.cjs`。
2. **`arkcli usage plan` 的 `percent` 已经是百分数。** `3.58` = 官网「当前会话 3.58%」。再 `×100` 会变成 358%。也不要把 `percent` 当 0–1 去乘写死的 1200/9000/18000。

核对：`session% × 1200 ≈ weekly% × 9000 ≈ monthly% × 18000`（Lite）。对得上说明额度数字对。

## 套餐额度折官网（请求 → 钱）

公开额度（百分比已与账号对过）：

| | 5h | 周 | 月 | 刊例（第三方，以活动页为准） |
| --- | --- | --- | --- | --- |
| Lite | 1200 | 9000 | 18000 | 约 ¥40/月 |
| Pro | 6000 | 45000 | 90000 | 约 ¥200/月 |

整档值多少 = `（本机去重后的官网¥ / 去重请求数）× 该档次数`。  
必须用真实 token 外推，禁止套营销「约 1 折 / 数亿 token」。Claude Code 高缓存命中时，单次官网价会被压得很低。

2026-08-22 本机样本（flash、空闲、高 hit，约 91 次）：**约 ¥0.006/次** → Lite 满月约 **官网 ¥108**（满 5h 窗约 ¥7）。全高峰约 2 倍；同 token 换 pro 约 3 倍；缓存几乎不命中可到四位数。样本会变，重算时用当前 transcript，不要把 ¥108 写成常数。

只扫本机 `~/.claude/projects/**/*.jsonl`，其他工具/机器的请求不在内。

## 底部用量行

启动器在 HUD 后再跑 `usage/index.cjs`。按 `ANTHROPIC_BASE_URL` 选厂家，**只用当前这一家**。

| 厂家 | 文件 | 匹配 | 数据源 |
| --- | --- | --- | --- |
| 火山 | `usage/vendors/volcengine.cjs` | `volces.com` / `ark.cn-beijing` | `arkcli plans get` + `arkcli usage plan --product coding-plan` |

新厂家：`vendors/` 加 `{ id, match(url), fetchLine() }`。index 自动加载。  
缓存 `usage-cache/<id>.json`，默认 60s。statusLine 每 5s 刷新，不要每次打 arkcli。

arkcli 必须走 **nvm 真实目录**（`realpath(node.exe)` 旁的 `arkcli.cmd`），不能走 `C:\nvm4w\nodejs` 符号链接（会 `update_execution_boundary`）。`ARKCLI_BIN` 可覆盖。未登录则用量行空。

## 禁止

- 重跑 `/claude-hud:setup`（冲掉启动器定制）
- 改 `plugins/cache/**/dist/cost.js` 换货币
- 把 arkcli 完整账号 JSON（viewer / user_id / 昵称）打进聊天
- `percent * 100` 或用写死额度把 percent 当比例
- 把 `官网¥` 说成套餐账单
