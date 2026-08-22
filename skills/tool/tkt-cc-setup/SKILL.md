---
name: tkt-cc-setup
description: "Claude Code + cc-switch 本机配置排查与一键修复。修切换供应商后底部 statusLine/claude-hud 消失、Both ANTHROPIC_AUTH_TOKEN and ANTHROPIC_API_KEY set、旧 statusline.js 盖住 HUD、美元改人民币、火山 Coding Plan 用量行。Actions: 修复, 配置, 排查, 一键配置, 恢复底部栏, 换人民币, 加用量, doctor, apply。Objects: cc-switch, statusLine, claude-hud, arkcli, 火山, ANTHROPIC_AUTH_TOKEN, ANTHROPIC_API_KEY, settings.json, common_config_claude。Triggers: ccswitch 切完底部没了, 双 token 警告, HUD 不显示, 配置底部状态栏, 美元换成人民币, 查询用量, /tkt-cc-setup, 一键配 claude-hud。"
argument-hint: [doctor|apply] [--dry-run]
metadata:
  scope: global
---

# tkt-cc-setup

IRON LAW: 只改 `~/.claude/settings.json` = 白改。cc-switch 下次切换会用 `common_config_claude` 整份覆盖。修复 MUST 同时写 settings.json + `common_config_claude`（及已有 statusLine 的 Claude 供应商）。先跑 doctor，再动手。禁止回显完整 API key / AUTH_TOKEN。

Red Flags（出现就回到 Step 1）:
- 只补了 settings.json / settings.local.json
- 跑完 `/claude-hud:setup` 就宣布完成
- 命令又指回 `~/.claude/statusline.js`
- 输出里出现完整 token

本 skill 引导 AI **排查 + 落配置**，不是讲概念。

## 模式

| 用户说法 | 做什么 |
| --- | --- |
| 为什么 / 排查 / 报错截图 | 只 doctor + 解释，不写文件 |
| 修复 / 一键配置 / 底部没了 / 配 HUD | doctor → 展示计划 → apply |
| 只问底部栏怎么配 | 读 `references/windows-statusline.md`，仍要写进 cc-switch 通用配置 |
| 人民币 / 用量 / 火山余额 | 读 `references/hud-display.md`，跑 apply 同步启动器 + usage/ |

`$ARGUMENTS` 含 `doctor` → 只诊断。含 `apply` / `--dry-run` → 按脚本执行。

## Workflow

```
tkt-cc-setup Progress:

- [ ] Step 1: 跑 doctor ⚠️ REQUIRED
- [ ] Step 2: 用检查项对上用户现象
- [ ] Step 3: 确认计划 ⚠️ REQUIRED
- [ ] Step 4: apply（conditional — 用户要修/配才跑）
- [ ] Step 5: 交代重启，不宣称已看见 HUD
```

## Step 1: 跑 doctor ⚠️ REQUIRED

在本 skill 目录执行（正本或已全局安装的副本）:

```bash
node --experimental-sqlite scripts/doctor.mjs
```

Ask: 每一项是 `ok` / `warn` / `fail`？`live_command` 和 `common_command` 是否同一个文件？

禁止手改 JSON 猜原因。doctor 失败才 Read 文件；读到 token 只报前缀（`sk-kimi-` / `ark-`）和长度。

## Step 2: 对现象

| 现象 | 对哪几项 |
| --- | --- |
| `Both ANTHROPIC_AUTH_TOKEN and ANTHROPIC_API_KEY set` | `auth_conflict`。进程残留 + settings 各用一种。User 注册表干净但 Cursor 还带着旧 key → 重启 Cursor / 新开终端 |
| 底部是 `目录 \| 模型 \| ctx N%` | `live_command` 指向 `statusline.js`（旧一行栏） |
| 底部只有默认 `repo \| model`、无 ctx%、无 HUD | statusLine 没跑或命令在 Git Bash 下静默失败 |
| 多行 Context 条 / 工具 / 用量 | HUD 已在，不要再套旧脚本 |
| 配过 HUD，一切换又没了 | `common_command` 仍是旧脚本或空 |
| 成本仍是 `$` | `cny_rewrite` fail — apply 同步启动器 |
| 火山底部没有用量行 | `usage_overlay` / `arkcli`。没装 arkcli 只 warn |

Windows + Git Bash 细节：Load `references/windows-statusline.md`。  
cc-switch 覆盖机制：Load `references/cc-switch-persist.md`。  
人民币 / 底部用量：Load `references/hud-display.md`。看 `cny_rewrite`、`usage_overlay`、`arkcli`。

## Step 3: 确认计划 ⚠️ REQUIRED

先列出将改路径，再动手：

- `~/.claude/settings.json` 的 `statusLine`
- `~/.cc-switch/cc-switch.db` → `settings.common_config_claude`
- 已有 `statusLine` 的 Claude 供应商 `settings_config`
- `~/.claude/plugins/claude-hud/statusline.mjs` + `usage/`（人民币改写 + 用量行）

用户已说「修复 / 一键配置 / 底部没了」= 同意 apply。只说「为什么」= 停在这里。

`--dry-run` 先看 diff，不写盘。

## Step 4: apply（conditional）

claude-hud 未装 → 停，让用户在 Claude Code 里自己执行：

```
/plugin marketplace add jarrodwatts/claude-hud
/plugin install claude-hud
```

然后 **不要** 跑 `/claude-hud:setup`（本机 Git Bash 下它会写成 `cmd.exe`，静默无输出）。用本 skill 的 apply 写命令。

```bash
node --experimental-sqlite scripts/apply.mjs --dry-run
node --experimental-sqlite scripts/apply.mjs
```

Ask: apply 退出码是否 0？`command` 是否含 `statusline.mjs`？`cny_rewrite` / `usage_overlay` 是否 ok？

火山用量依赖本机 `arkcli`。不在 PATH → 用量行空，不阻塞 HUD。新厂家：只在 `scripts/hud/usage/vendors/` 加模块，再 apply。

费用：DeepSeek 走官网价表 `usage/pricing/deepseek.cjs`（峰谷、元/百万 token）。Coding Plan 是套餐次数，官网 ¥ 是等价参考。价变改表，不抓网页。

双 token：apply **不改** 环境变量。注册表已净、进程还有旧 `ANTHROPIC_API_KEY` → 让用户关 Cursor 重开，或在将跑 `claude` 的终端里删掉残留 `ANTHROPIC_*`（API_KEY + 旧 BASE_URL + 旧模型名）。不要只 `unset` 一个。

## Step 5: 收尾

必须让用户 **退出并重开 `claude`**。热重载经常仍跑旧 command。

不写「HUD 已显示」。写：重开后再看底部是多行 HUD 还是旧一行；把结果发回来。

## Anti-Patterns

- 只改 `settings.json` 或只改 `settings.local.json`（user 级 local **盖不住** cc-switch 覆盖）
- `/claude-hud:setup` 当一键方案（会冲掉 CNY 改写和用量行）
- 改插件 `dist/cost.js` 换货币
- 把 HUD 命令改回 `node .../statusline.js`
- 完整打印 token / 把 key 写进 skill
- 没跑 doctor 就手写 JSON
- 宣称修好但用户没重开 `claude`

## Pre-Delivery Checklist

- [ ] doctor 已跑，结论来自脚本输出
- [ ] 若 apply：三处都写了（live + common_config + providers）
- [ ] 输出无完整 secret
- [ ] 用户被要求重开 `claude`
- [ ] 未把 `/claude-hud:setup` 当完成条件
