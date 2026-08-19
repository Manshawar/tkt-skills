---
name: tkt-socratic
description: "Post-implementation Socratic review for code changes. AI self-questions using code-adapted templates, generates 3-5 key risk points for user confirmation. Use when user says 'socratic check', 'acceptance criteria', 'tkt socratic', or invokes /tkt-socratic. Triggers: socratic, acceptance, risk, checklist, acceptance review."
metadata:
  scope: global
---

# tkt-socratic

IRON LAW: Generate at most 5 key risk points. Do NOT trigger for text/comment/style-only changes.

## Workflow

Copy this checklist and check off items as you complete them:

```
tkt-socratic Progress:

- [ ] Step 1: Determine if review is needed ⚠️ REQUIRED
- [ ] Step 2: Read question-templates.md
- [ ] Step 3: Self-question against code changes
- [ ] Step 4: Generate 3-5 key risk points
- [ ] Step 5: Present to user for confirmation
```

## Step 1: Determine If Review Is Needed ⚠️ REQUIRED

Ask: "这次改动属于哪一类?"

Trigger review for:
- 新功能点
- 模块级重构
- 接口/公共 API 改动
- 性能/并发相关
- 数据流改动

Skip review for:
- 改注释/文档/字符串
- 语法/类型 bug 修复
- 风格/lint 调整

If skipped, tell user: "This change type does not require Socratic review."

## Step 2: Read Question Templates

Read `references/question-templates.md`.

## Step 3: Self-Question Against Code Changes

Use the six code-adapted Socratic questions:

1. 定义与概念： "这个函数/模块的核心职责是什么？是否单一？"
2. 假设与前提： "输入假设是什么？边界条件覆盖了吗？"
3. 理由与证据： "有测试用例支持这个实现吗？"
4. 观点与视角： "换个调用方视角，这个接口好用吗？"
5. 后果与影响： "这个改动会影响哪些下游模块？"
6. 问题与目的： "这段代码真正要解决的问题是什么？"

## Step 4: Generate 3-5 Key Risk Points

Based on self-questioning, output 3-5 concrete risk points.

Format:

```
关键风险点:

- [ ] 风险点1 — 影响/建议
- [ ] 风险点2 — 影响/建议
- [ ] 风险点3 — 影响/建议
```

## Step 5: Present to User for Confirmation ⚠️ REQUIRED

Ask user to check each item. Do NOT proceed to next workflow step until user confirms.

## References

- `references/question-templates.md` — 代码场景苏格拉底提问模板

## Anti-Patterns

- Do NOT generate more than 5 risk points.
- Do NOT trigger for text/comment/style-only changes.
- Do NOT modify code based on risk points without user approval.

## Pre-Delivery Checklist

- [ ] Determined if review is needed
- [ ] Read question-templates.md
- [ ] Self-questioned all six categories
- [ ] Generated 3-5 risk points (not more)
- [ ] Presented to user for confirmation
