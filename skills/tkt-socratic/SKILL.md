---
name: tkt-socratic
description: "Post-implementation Socratic review for code changes. AI self-questions using code-adapted templates, generates 3-5 key risk points for user confirmation. Use when user says 'socratic check', 'acceptance criteria', 'tkt socratic', or invokes /tkt-socratic. Triggers: socratic, acceptance, risk, checklist, acceptance review."
metadata:
  scope: global
---

# tkt-socratic

IRON LAW: Generate at most 5 key risk points. Do NOT trigger for text/comment/style-only changes.

## 实质影响原则（每个风险点必须过这一关）

- 先问：**这个风险点对项目有没有实质性影响？**
- 实质性影响 = 不改会引发问题（逻辑错 / 数据错 / 崩溃 / 下游破坏 / 性能劣化 / 安全风险），或改了有可感知收益
- **无实质影响的不提**：改了（或没改）对实际功能、性能、可维护性、兼容性等任何方面都无差异的点，不提
- **不能为了提问题而提问题**：凑数、刷存在感、仅风格偏好、可改可不改的点，一律剔除
- 产出宁可少而准，不可多而废——风险点是给用户确认的，不是清单展览

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

Based on self-questioning, output 3-5 concrete risk points. **每个风险点先用「实质影响原则」过滤**——无实质影响的剔除，宁缺毋滥。

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
- Do NOT raise points with no substantive impact (style-only, cosmetic, optional refactors).
- Do NOT pad the count to hit 3-5 — fewer real risks beats filler.

## Pre-Delivery Checklist

- [ ] Determined if review is needed
- [ ] Read question-templates.md
- [ ] Self-questioned all six categories
- [ ] Generated 3-5 risk points (not more)
- [ ] Presented to user for confirmation
