---
name: tkt-verify
description: "Verification pipeline advisor. Map code change types to verification steps (typecheck, lint, unit test, build, e2e) ordered by cost. Output commands for the user to run. Use when user says 'verify this change', 'run checks', 'what tests to run', 'tkt verify', or invokes /tkt-verify. Triggers: verify, typecheck, lint, test, build, e2e, pipeline, validation, check code."
metadata:
  scope: project
---

# tkt-verify

IRON LAW: Output commands for the user to run. Do NOT execute verification on behalf of the user.

## Workflow

Copy this checklist and check off items as you complete them:

```
tkt-verify Progress:

- [ ] Step 1: Ask user what changed ⚠️ REQUIRED
- [ ] Step 2: Read verify-pipeline.md
- [ ] Step 3: Output matching verification commands
```

## Step 1: Ask User What Changed ⚠️ REQUIRED

Ask: "这次改动属于哪一类?"

Options:
- 语法/类型 bug
- 风格/规范调整
- 功能点实现
- 模块级改动
- 用户流程改动

## Step 2: Read Verify Pipeline

Read `references/verify-pipeline.md` to map change type to verification steps.

## Step 3: Output Matching Verification Commands

Output exact commands for the user to run, ordered by cost (low to high).

Format:

```
验证步骤:

1. `command1` — 说明
2. `command2` — 说明
```

## References

- `references/verify-pipeline.md` — 改动类型与验证步骤映射
- `references/verify-hooks.md` — hook 设计批注； 实际 hook 由 `tkt-rules` 初始化生成

## Anti-Patterns

- Do NOT run verification commands yourself.
- Do NOT suggest running e2e for a one-line type fix.
- Do NOT skip typecheck for any code change.

## Pre-Delivery Checklist

- [ ] Asked user what changed
- [ ] Read verify-pipeline.md
- [ ] Output commands are exact syntax
- [ ] Commands ordered by cost (low to high)
- [ ] No verification executed by the skill
