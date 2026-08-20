---
name: tkt-guide
description: "Workflow routing guide for AI-assisted development. Ask user which step they are at, then output the next skill or plugin command for the user to run themselves. Use when user says 'what's next', 'which step', 'workflow guide', 'tkt guide', '方案探讨', '方案讨论', '方案选型', '评估方案', '需求讨论', '验证', or invokes /tkt-guide. Triggers: workflow, next step, routing, guide, grill, spec, tickets, implement, review, brainstorm, superpower, verify, validation, run checks, what tests to run, 验证, 方案探讨, 方案讨论, 方案选型, 评估方案, 需求讨论."
metadata:
  scope: global
---

# tkt-guide

IRON LAW: Only output commands for the user to run. Do NOT install skills or plugins on behalf of the user.

## Workflow

Copy this checklist and check off items as you complete them:

```
tkt-guide Progress:

- [ ] Step 1: Read workflow index ⚠️ REQUIRED
- [ ] Step 2: Ask user which step they are at ⚠️ REQUIRED
- [ ] Step 3: Read matching workflow reference
- [ ] Step 4: Output next-step command
```

## Step 1: Read Workflow Index ⚠️ REQUIRED

Read `references/workflow-index.md` to understand available scenarios.

## Step 2: Ask User Which Step They Are At ⚠️ REQUIRED

Ask: "你现在处于哪一步?"

场景分类与路由映射以 `workflow-index.md` 为准，不要凭记忆猜——先问清用户落在哪个场景，再查表。

## Step 3: Read Matching Workflow Reference

从 `workflow-index.md` 找到匹配用户答案的那一行，读对应 reference 文件。

## Step 4: Output Next-Step Command

Output one exact command for the user to run themselves.

Format:

```
下一步: <command>

说明: <one sentence why>
```

## Anti-Patterns

- Do NOT install anything on behalf of the user.
- Do NOT modify AGENTS.md or CLAUDE.md.
- Do NOT create docs/ skeleton.
- Do NOT assume the user's step — always ask first.

## Pre-Delivery Checklist

- [ ] Asked user which step they are at
- [ ] Read only the matching reference file
- [ ] Output is a single exact command
- [ ] No installation performed by the skill
