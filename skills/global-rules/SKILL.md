---
name: global-rules
description: "维护 Claude Code / Cursor 全局协作规则。正本 references/canonical.md 保持原文；变化后只跑脚本复制、覆盖、按产品改名到 ~/.claude/CLAUDE.md 与 ~/.cursor/rules/global.mdc。禁止软链和 @include。Triggers: 同步全局规则, sync global rules, 改全局 CLAUDE.md, Cursor global.mdc, 全局回复风格, Session Receipt, 复制全局规则, apply global-rules。"
metadata:
  scope: global
---

# Global Rules

IRON LAW: `references/canonical.md` 是唯一原文。禁止改写、禁止软链、禁止 `@include`。变化后只跑 `sync.py apply`：复制正文、覆盖旧文件、改名为各产品全局文件名。

## Workflow

```
- [ ] 1. status 看漂移 ⚠️ REQUIRED
- [ ] 2. 改文案只动 canonical（conditional）
- [ ] 3. 用户确认后 apply ⛔ BLOCKING
- [ ] 4. 再跑 status，两个目标都是 OK
```

## 映射

| 动作 | Claude Code | Cursor |
| --- | --- | --- |
| 复制原文 | `~/.claude/CLAUDE.md` | 同正文 |
| 替换 | 覆盖已有文件/软链 | 覆盖已有文件/软链 |
| 重命名 | `CLAUDE.md` | `global.mdc`（仅前置 `alwaysApply` frontmatter） |

Cursor Settings → User Rules 不是文件，脚本改不了。里面若还有旧 `@` 路径，提醒用户删。

## 命令

```bash
python3 ~/.claude/skills/global-rules/scripts/sync.py status
python3 ~/.claude/skills/global-rules/scripts/sync.py diff
python3 ~/.claude/skills/global-rules/scripts/sync.py apply
```

`apply` 同时把本 skill 目录复制到 `~/.agents/skills/global-rules`。

## Anti-Patterns

- 直接改 `CLAUDE.md` / `global.mdc` 当正本
- `ln -s` 或 `@/Users/...` 当同步
- 把 graphify / 项目 `AGENTS.md` 写进 canonical
- 未确认就 apply

## Pre-Delivery

- [ ] `status`：claude / cursor 都是 `OK`，不是 `SYMLINK`
- [ ] `CLAUDE.md` 正文与 canonical 一致（无 `@AGENTS.md`）
- [ ] 未改 toolkit 项目内 `AGENTS.md`
