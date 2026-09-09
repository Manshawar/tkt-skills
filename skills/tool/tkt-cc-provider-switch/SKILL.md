---
name: tkt-cc-provider-switch
description: "用 cc-switch CLI 在供应商(provider)间动态切换 Claude Code——临时开某厂商的独立终端(不污染全局 current provider),或持久切换默认厂商。供应商含 qax/deepseek、kimi、火山ARK豆包、Xiaomi MiMo 等本机已配 provider。Actions: 临时启动, 临时开, 切到, 切换到, 用某某开, 持久切换, 换默认, 列出, 看有哪些, 验key, 测连通, 检查CLI版本, 升级CLI, dry-run预览。Objects: cc-switch, provider, 供应商, 火山ARK, doubao, mimo, kimi, qax, claude终端, start, switch, current provider, settings临时文件。Triggers: 用火山开个终端, 临时用mimo, 切到kimi, 换个厂商跑, cc-switch临时模式, 起个某供应商的claude, /tkt-cc-provider-switch。"
metadata:
  scope: global
---

# tkt-cc-provider-switch

IRON LAW: **临时启动 MUST 用 `cc-switch start`，绝不手改 `~/.claude/settings.json`**。改全局 settings.json = 白改还污染——cc-switch 下次切换会用 `common_config_claude` 整份覆盖你手改的东西。供应商/key 状态**不内置本 skill**，一律 `provider list` 实时查（厂商会变，文档会过期）。禁止回显完整 API key / AUTH_TOKEN（只报前缀 + 长度）。

Red Flags（出现就停）:
- 手改 `~/.claude/settings.json` 想"切个供应商"
- 输出里出现完整 token / `sk-` 全文
- 把本机厂商/key 状态写死进 skill 正文
- CLI 报"数据库版本过旧"还硬跑（先升级，见坑 1）
- 直接 `export` 或 symlink 手工当安装（走 `npx skills add`，见安装）

本 skill 引导 AI 用 **cc-switch CLI**（v5.10+，`~/.local/bin/cc-switch`）操作供应商，不是改配置。

## 模式

| 用户说法 | 做什么 |
| --- | --- |
| 用 XX 临时开个终端 / 起个某厂商的 claude | `start claude <名>`（不切全局） |
| 临时启动前想预览 | 加 `--dry-run` |
| 切默认厂商 / 以后都用 XX | `provider switch <ID>` |
| 看有哪些厂商 / 当前用谁 | `provider list` |
| 这厂商能通吗 / key 有效吗 | 验 key（见 Step 3） |

`$ARGUMENTS` 含 `start` → 临时启动路径。含 `switch`/`use` → 持久切换路径。含 `list` → 只列表解释。含 `verify`/`测` → 走 Step 3 验 key。

## Workflow

```
tkt-cc-provider-switch Progress:

- [ ] Step 1: 确认 cc-switch CLI 可用 ⚠️ REQUIRED
- [ ] Step 2: provider list 拿准厂商名/ID ⚠️ REQUIRED
- [ ] Step 3: (用户要验key/连通才走) 验网关+模型可达
- [ ] Step 4: 执行——临时启动 或 持久切换
- [ ] Step 5: 交代重开/验证，不宣称已生效
```

## Step 1: 确认 CLI 可用 ⚠️ REQUIRED

```bash
cc-switch --version
```

Ask: 版本是否 ≥5.10？CLI 是否在 `~/.local/bin/cc-switch`？

- 若报 **"数据库版本过旧 / 打不开数据库"** → CLI 旧于数据库 schema，先升级（坑 1）。
- 报权限 0644 警告 → 只提示，不阻塞（GUI 会处理）；不手改权限除非用户要求。

## Step 2: provider list 拿准名字 ⚠️ REQUIRED

```bash
cc-switch -a claude provider list
```

Ask: 用户说的厂商，list 里 Name 精确叫啥？current（✓ 那行）是谁？

- selector 用 **Name 或 ID** 皆可，精确匹配。ID 更稳（重名时）。
- list 输出底部 `→ Current:` 是当前激活 provider。

## Step 3: 验 key / 连通（conditional）

用户问"XX 能通吗 / key 有效吗 / 能不能用"才走。从 cc-switch.db 读该 provider env，请求其 `ANTHROPIC_BASE_URL/v1/messages`：

- 用 node `DatabaseSync` 读 `~/.cc-switch/cc-switch.db` → `providers.settings_config` 的 env（key 只取，不打印）。
- 发最小请求 `{model: env.ANTHROPIC_MODEL, max_tokens: 20, messages:[{role:'user',content:'ping'}]}`，头 `x-api-key` + `anthropic-version: 2023-06-01`。
- **HTTP 200** → key 有效可用。**401 invalid_key** → key 过期/占位，报"需更新 key"，不硬用。

## Step 4: 执行

### 临时启动（不切全局，推荐日常）

```bash
cc-switch start claude "<provider Name>"
```

- 机制：生成**临时 settings.json**（系统临时目录）→ `claude --settings <临时文件>` → 全局 current provider 不变。
- 可透传 claude 参数：`cc-switch start claude "<Name>" -- --dangerously-skip-permissions`
- 先预览：加 `--dry-run`（只显示将生成的命令与设置路径，不写盘不启动）。

### 持久切换（改全局默认）

```bash
cc-switch provider switch "<provider ID>"     # 或 cc-switch use "<ID>"
```

- 影响所有后续 claude 会话。用户改主意切回：`cc-switch provider switch "<原 provider ID>"`。

## Step 5: 验证

- 临时启动：新终端起来后 `/model` 看模型是否该厂商；或跑一句让它自报。
- 持久切换：`provider list` 确认 `→ Current:` 已变。**已开的旧会话不受影响**，需重开才用新 provider。

## 坑（实测 2026-09）

1. **CLI 版本落后于数据库 schema** → 报"数据库版本过旧"。修：`cc-switch update`（自升级）。旧版 v5.9.3 打不开 db version 18；v5.10.4 正常。
2. **cc-switch.db 里的 key 可能失效**：mimo 曾存 401 invalid_key（过期/占位）。验过再信，别假设配置即可用。
3. **GUI app 内嵌二进制 ≠ CLI**：`/Applications/CC Switch.app/Contents/MacOS/cc-switch` 对子命令无输出（GUI 启动器）。真正的 CLI 是 `~/.local/bin/cc-switch`（npx skills 之外的独立安装）。
4. 厂商/provider 会增删，**别把本机列表写死进 skill**，每次 `provider list` 实时查。

## 安装 / 分发

- 本 skill 正本在 `~/utils/tkt-skills/skills/tool/tkt-cc-provider-switch/`（git: Manshawar/tkt-skills）。
- 分发到本机：`npx skills add Manshawar/tkt-skills -g --skill tkt-cc-provider-switch`（装到 `~/.agents/skills/` + symlink 到 `~/.claude/skills/`）。
- 更新：仓库改 → push → 同命令重拉。勿手工 cp / symlink 当安装。
