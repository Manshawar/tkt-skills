# 外部下载的 skill 清单

本机（manshawar）从**第三方仓库**装的 skill 留档，用于换机器时复现。
本仓库自研的 skill（`skills/dev/`、`skills/tool/`）不在此列——它们由 `npx skills add Manshawar/tkt-skills -g` 安装。

**权威来源**：`~/.agents/.skill-lock.json`（`npx skills` 的 lockfile，记录 source / skillPath / 安装与更新时间）。
本文件是它的人类可读快照，两者冲突时以 lockfile 为准。

安装目标列：`A` = `~/.agents/skills/`，`C` = `~/.claude/skills/`。更新时间取自 lockfile `updatedAt`。

## 一、npx skills 装的（lockfile 可追溯）

### obra/superpowers — 14 个

流程类 skill（计划、调试、TDD、评审、worktree）。本机只装在 `~/.agents/skills/`，Claude Code 侧通过 `superpowers@claude-plugins-official` 插件以 `superpowers:<name>` 暴露。

| skill | 更新时间 |
|---|---|
| brainstorming | 2026-08-19 |
| dispatching-parallel-agents | 2026-08-19 |
| executing-plans | 2026-08-19 |
| finishing-a-development-branch | 2026-08-19 |
| receiving-code-review | 2026-08-19 |
| requesting-code-review | 2026-08-19 |
| subagent-driven-development | 2026-08-19 |
| systematic-debugging | 2026-08-19 |
| test-driven-development | 2026-08-19 |
| using-git-worktrees | 2026-08-19 |
| using-superpowers | 2026-08-19 |
| verification-before-completion | 2026-08-19 |
| writing-plans | 2026-08-19 |
| writing-skills | 2026-08-19 |

### mattpocock/skills — 7 个

产品/工程流程类：需求 grill、spec、ticket 拆分、实现、code review。`grill-me` / `grilling` / `grill-with-docs` 三者是 grill 的不同强度。

| skill | 更新时间 |
|---|---|
| grill-me | 2026-08-18 |
| grill-with-docs | 2026-08-18 |
| grilling | 2026-08-26 |
| to-spec | 2026-08-26 |
| to-tickets | 2026-08-26 |
| implement | 2026-08-18 |
| code-review | 2026-08-26 |

### sanyuan0704/sanyuan-skills — 6 个

学习与 skill 工程类。

| skill | 更新时间 |
|---|---|
| skill-forge | 2026-09-09 |
| skill-review | 2026-09-09 |
| book-study | 2026-09-09 |
| sigma | 2026-09-09 |
| wiki-ingest | 2026-09-09 |
| code-review-expert | 2026-09-09 |

### vercel-labs — 2 个

| skill | 来源仓库 | 更新时间 |
|---|---|---|
| find-skills | vercel-labs/skills | 2026-07-20 |
| agent-browser | vercel-labs/agent-browser | 2026-08-26 |

## 二、非 npx skills 装的（lockfile 无记录）

| skill | 说明 |
|---|---|
| impeccable | v4.1.1，Apache 2.0；装进 `~/.claude/skills/` 与 `~/.agents/skills/`，含 `reference/` + `scripts/` 子目录 |

**安装来源未确认**：lockfile 无记录，`~/.npm/_npx` 缓存里也没有；SKILL.md 的 `allowed-tools` 写的是 `Bash(npx impeccable *)`，官网 <https://impeccable.style>，但 npm registry 上 `impeccable` 最新版是 3.6.0（低于本地 skill 的 4.1.1），所以「经 `npx impeccable` 安装」只是推测。换机器时按官网说明重装，别照抄这里的猜测。

## 三、复现与更新

```bash
# 复现（换机器）
npx skills add obra/superpowers -g
npx skills add mattpocock/skills -g
npx skills add sanyuan0704/sanyuan-skills -g
npx skills add vercel-labs/skills -g
npx skills add vercel-labs/agent-browser -g
# impeccable: 来源未确认,见上节,按官网说明重装

# 更新(会批量拉所有已装 skill 的上游最新版,含上表全部来源)
npx skills update
npx skills update <name>   # 只更新指定的
```

只改本仓库自研 skill 时**不要**用 `update`——它会把上表外部来源一并拉到最新版,可能带回不想要的变更;用 `npx skills add Manshawar/tkt-skills -g` 精准同步。

Claude Code 插件侧（`~/.claude/plugins/installed_plugins.json`）：`superpowers@claude-plugins-official`、`document-skills@anthropic-agent-skills`、`rust-analyzer-lsp`、`typescript-lsp`、`claude-hud`。插件的 skill 随插件更新，不走上面的 lockfile。

## 四、维护约定

- 新装外部 skill 后，更新本文件的表格 + 来源分组；lockfile 会同步自动更新。
- 本机自研 skill 改动**只改 `skills/`**，不要把外部 skill 复制进本仓库（会与上游分叉、丢掉更新）。
- 已废弃的外部 skill：先在 lockfile 里确认移除，再从本文件删行。
