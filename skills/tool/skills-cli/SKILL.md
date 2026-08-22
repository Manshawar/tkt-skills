---
name: skills-cli
description: "npx skills 命令速查与判断树。装/更新/查/移除 skill 前先用本 skill 判断该用哪个命令。Use when user says 'npx skills', 'skills add', 'skills update', '装 skill', '更新 skill', '同步 skill', or invokes /skills-cli. Triggers: skills, skill install, skill update, npx skills."
metadata:
  scope: global
---

# skills-cli

`npx skills` 的渐进式导引。**SKILL.md 只给判断树,具体命令与参数见 references/skills-cli-ref.md。**

IRON LAW: 动手前先判断该用哪个命令,不要凭记忆瞎跑。装完 skill 后告诉用户 skill 已就位,可复用。

## 判断树:该用哪个命令?

```
用户意图                        → 命令
─────────────────────────────────────────────────────────────
首次装某个 skill / 仓库        → skills add <repo> -g [--skill <name>]
改完自己的 skill 正本,同步本机  → skills add <repo> -g        (用 add, 精准推送本仓库)
批量跟随所有上游最新             → skills update              (会动其他源, 慎用)
看装了哪些 skill                → skills list
看某个仓库有哪些 skill 可选      → skills add <repo> -l
搜生态里有啥 skill               → skills find [query]        (交互式)
卸掉一个 skill                  → skills remove <name>
不装先看 prompt                  → skills use <repo>@<skill>
初始化新 skill                  → skills init <name>
```

## 核心规则(三条)

1. **改自己 skill 正本 → 用 `add`, 不用 `update`**。`add` 只动你指定的仓库;`update` 会批量拉所有上游,可能带回不想要的变更。
2. **全局 vs 项目级**:`-g` 全局(装到 `~/.agents/skills/`,所有项目可用);不带 `-g` 项目级。外部工具 skill 一律 `-g`。
3. **加 `-y` 跳过交互**(非 TTY 环境必须);`--skill <name>` 只装仓库里指定的那个。

## 本机常用命令(直接抄)

```bash
# 改完 tkt-skills 正本后的同步
npx skills add Manshawar/tkt-skills -g

# 从外部仓库装指定 skill
npx skills add mattpocock/skills -g --skill grill-me

# 看装了啥 / 仓库有啥
npx skills list
npx skills add obra/superpowers -l
```

完整命令 + 参数 + 项目级说明 → **references/skills-cli-ref.md**
