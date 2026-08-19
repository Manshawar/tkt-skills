# 外部依赖：skill / plugin 安装路由

外部依赖有**两套互斥的安装机制**，先判断再装，别混用：

| 机制 | 判定 | 装到哪 |
|---|---|---|
| **Claude Code plugin** | 仓库含 `.claude-plugin/`（有 `marketplace.json`） | `~/.claude/plugins/`（user）/ `.claude/plugins/`（project） |
| **npx skills** | 仓库是 skills 集合（顶层 `skills/`，含多个 SKILL.md），无 plugin 声明 | `~/.agents/skills/`（`-g`） |

判定方法：看一眼目标仓库根目录有没有 `.claude-plugin/`。

---

## 一、Claude Code plugin 机制

先查官方 marketplace 是否已收录，收录则一条命令搞定，**不要自己加 marketplace**：

```bash
# 官方收录（最省事，推荐先查）：
claude plugin install superpowers -s project    # 项目级
claude plugin install superpowers               # 全局（默认 user）

# 官方未收录、但仓库有 .claude-plugin/ 时：
claude plugin marketplace add <owner>/<repo> --scope project
claude plugin install <plugin> -s project
```

> 验证官方收录：`claude plugin marketplace list` → `claude-plugins-official` 在列；或直接 `claude plugin install <名> -s project` 试，成功即收录。

### 已知 plugin 生态依赖

| 名称 | 上游地址 | 安装 |
|---|---|---|
| superpowers | obra/superpowers | `claude plugin install superpowers -s project`（官方 marketplace 已收录；**勿用 npx skills 装**） |

## 二、npx skills 机制

```bash
# 全局（推荐，供所有项目复用）
npx skills add <owner>/<repo> -g --skill <name>
# 项目级（会写 skills-lock.json + 软链进仓库 skills/，通常不用于本仓库）
npx skills add <owner>/<repo> --skill <name>
```

> **本仓库警告**：`skills/` 是书写源文件目录，不是安装落点。外部 skill 一律 `-g` 全局装；只有本仓库自己书写的 skill 才进 `skills/`。

### 已知 npx skills 生态依赖

| 名称 | 上游地址 | 安装 |
|---|---|---|
| grill-me | mattpocock/skills | `npx skills add mattpocock/skills -g --skill grill-me` |
| grilling | mattpocock/skills | 同上 |
| grill-with-docs | mattpocock/skills | 同上 |
| to-spec | mattpocock/skills | 同上 |
| to-tickets | mattpocock/skills | 同上 |
| implement | mattpocock/skills | 同上 |
| code-review | mattpocock/skills | 同上 |
| agent-browser | vercel-labs/agent-browser | `npx skills add vercel-labs/agent-browser -g` |
| find-skills | vercel-labs/skills | `npx skills add vercel-labs/skills -g --skill find-skills` |
| skill-forge | sanyuan0704/sanyuan-skills | `npx skills add sanyuan0704/sanyuan-skills -g --skill skill-forge` |
| skill-review | sanyuan0704/sanyuan-skills | 同上 |
| wiki-ingest | sanyuan0704/sanyuan-skills | 同上 |

## 原则

- 先判定机制（有无 `.claude-plugin/`），再选命令；不要凭名字猜
- 官方 marketplace 已收录的（superpowers），一条 `claude plugin install` 完事，不加 marketplace
- 本仓库 `skills/` 不落外部安装，只放自写 skill 源文件
- 所有命令输出给用户自己跑，不替用户安装
