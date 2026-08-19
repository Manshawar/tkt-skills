---
name: tkt-guide
description: "Workflow routing guide for AI-assisted development. Ask user which step they are at, then output the next skill or plugin command for the user to run themselves. Use when user says 'what's next', 'which step', 'workflow guide', 'tkt guide', or invokes /tkt-guide. Triggers: workflow, next step, routing, guide, grill, spec, tickets, implement, review, brainstorm, superpower."
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

Common scenarios:
- 需求模糊，需要澄清
- 有需求，要写规格
- 规格好了，要拆任务
- 任务好了，要实现
- 实现完了，要评审
- 没思路，要 brainstorm
- 想装某个外部 skill / plugin（如 superpowers、grill-me）→ 走 external-deps.md

## Step 3: Read Matching Workflow Reference

Based on user answer, read the matching reference file:

| Scenario | Reference |
|---|---|
| 需求模糊 / 写规格 / 拆任务 / 实现 / 评审 | `references/workflow-grill.md` |
| 没思路 / 重设计 | `references/workflow-superpower.md` |
| **想装外部 skill / plugin** | `references/external-deps.md` |

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
