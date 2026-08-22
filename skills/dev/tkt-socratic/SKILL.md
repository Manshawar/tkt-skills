---
name: tkt-socratic
description: "On-demand acceptance gate for a finished work delivery — Socratic review that self-questions against the changes and outputs key risk points (at most 5, three gates, no padding) for user confirmation. Use when user says 'socratic check', '验收', '把关', '收尾评价', '风险复盘', 'tkt socratic', or invokes /tkt-socratic. Triggers: socratic, acceptance, risk, checklist, acceptance review, review my work, 验收, 把关, 收尾, 风险复盘."
metadata:
  scope: global
---

# tkt-socratic

IRON LAW: At most 5 key risk points, **no lower bound — never pad to fill a count**. Do NOT trigger for text/comment/style-only changes.

## 实质影响原则（每个风险点必须连过三闸门，任何一闸不过即剔除）

### 闸门一：现实触发
**不改，在当前环境/当前代码路径上，具体什么输入或操作会产生失败/错误？**

- 必须能写出具体触发路径（文件:行 + 场景 + 后果）
- 只能答出「未来可能 / 换环境会 / 低概率边界 / 假如用户…… / 一旦……」这类**假设场景**的 → 剔除
- 判据：触发条件在当前工作流里真实存在吗？不存在的场景不是风险

### 闸门二：修复收益
**改了，当前流程哪个具体场景变好？收益可感知吗？**

- 必须能说出可感知收益：更快 / 更稳 / 更省 / 不挂 / 排查更快
- 收益是「潜在 / 可改可不改 / 仅风格 / 仅可维护性讨好」的 → 剔除
- 判据：这条不改，今天会不会有人踩到？不会 → 剔除

### 闸门三：本质属性排除
**这是缺陷，还是功能设计意图的固有属性？**

- 如果换掉它反而削弱功能本质（例：真实端到端测试的固有耗时与不稳定、AI 生成的固有语义漂移），那是**设计权衡**，不是缺陷 → 剔除（或标注为「设计约束」而非风险点）
- 判据：修了它会不会让功能偏离其本来目的？

产出宁可少而准，不可多而废——风险点是给用户确认的，不是清单展览。宁缺毋滥，**0 条也合法**。

## Workflow

Copy this checklist and check off items as you complete them:

```
tkt-socratic Progress:

- [ ] Step 1: Determine if review is needed ⚠️ REQUIRED
- [ ] Step 2: Read question-templates.md
- [ ] Step 3: Self-question against code changes
- [ ] Step 4: Generate key risk points (at most 5)
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

## Step 4: Generate Key Risk Points (at most 5, no lower bound)

Based on self-questioning, output only the risk points that survive all three gates — **at most 5, 实质几条就几条, 0 条也合法**（0 条时直接说「无实质风险点」）。

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
- Do NOT raise **hypothetical scenarios** (future / env-switch / edge-case / "what if") — they fail the reality-trigger gate.
- Do NOT flag **design-intent tradeoffs** as defects (inherent latency of real end-to-end tests, AI semantic drift) — that's a design constraint, not a risk.
- Do NOT lower the bar to reach 3-5 items — **0 real risks beats filler**.

## Pre-Delivery Checklist

- [ ] Determined if review is needed
- [ ] Read question-templates.md
- [ ] Self-questioned all six categories
- [ ] Every risk point passed all three gates (reality-trigger / fix-benefit / design-intent)
- [ ] Generated risk points (at most 5, no lower bound)
- [ ] Presented to user for confirmation
