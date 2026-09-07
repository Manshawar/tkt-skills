---
name: global-rules-sync
description: 同步全局协作规则到两端指令文件（Claude Code 主 agent.md、Cursor global.mdc）。改完 ~/.claude/CLAUDE.md（主 agent.md）后调用本 skill，让两个 AI 环境拿到一致的约束。Actions: 同步, sync, 全局规则, agent.md 同步, 约束同步, global rules. Objects: CLAUDE.md, global.mdc, cursor. Triggers: 改主agent.md后同步、同步全局规则、全局规则不一致、同步规则到cursor、/global-rules-sync.
metadata:
  scope: global
---

# 全局规则同步

正本唯一：`~/.claude/CLAUDE.md`（Claude Code 主 agent.md）。本 skill 把它渲染到另一个环境（Cursor），两端约束一致。dsh 已放弃（不成熟），不再同步。

## 触发场景

- 修改了 `~/.claude/CLAUDE.md`（主 agent.md）任何内容，需要让 Cursor 跟上
- 发现两端规则不一致，需要重放同步
- 首次在新机器初始化，要建出两个指令文件

## 同步目标

| 环境 | 文件 | 渲染规则 |
|---|---|---|
| Claude Code | `~/.claude/CLAUDE.md`（正本） | 原样，正文无同步文本 |
| Cursor | `~/.cursor/rules/global.mdc` | 加 frontmatter（`---\ndescription: 全局协作规则 — 回复风格 + Session Receipt\nalwaysApply: true\n---`）后接正本全文 |
| tkt-skills 留档（仅 manshawar 本机） | `~/utils/tkt-skills/global/CLAUDE.md` | 纯正文，正本原样 |

## 工作流

1. 读取正本 `~/.claude/CLAUDE.md`
2. 在本 skill 目录执行 `node scripts/sync.mjs --dry-run` 预览差异（自动探测 tkt-skills 留档是否纳入）
3. 若无问题，执行 `node scripts/sync.mjs` 写入
4. 校验各目标文件已写入、内容与正本一致；若 tkt-skills 留档有变更，在 `~/utils/tkt-skills` `git commit` + `git push` 提交

## 反模式

- **不要把同步文本/脚本写进正本正文**——正本只管规则，同步逻辑全在 skill 里
- 不在两处手工各改一份，改只改正本，其余走本 skill
- 不给 Cursor 单独维护精简版，两端正文一致（Cursor 差异只在 frontmatter）
- 不要用 diff 命令逐行比对正本与 `global.mdc` 的 frontmatter 段——那是预期差异

## 交付检查

- [ ] 正本 `~/.claude/CLAUDE.md` 无「全局规则同步」字样
- [ ] `~/.cursor/rules/global.mdc` 有 frontmatter，正文与正本逐行一致
- [ ]（manshawar 本机）`~/utils/tkt-skills/global/CLAUDE.md` 与正本逐行一致，变更已提交推送
- [ ] 两端各自能正确加载（Claude 读 CLAUDE.md、Cursor 读 global.mdc）
