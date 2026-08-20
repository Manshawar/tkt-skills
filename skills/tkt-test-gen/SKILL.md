---
name: tkt-test-gen
description: "根据 git diff 的代码改动生成 Midscene 视觉回归测试用例(自然语言断言),写回 e2e/ 的 spec + cases.json,半自动(草稿人确认后入库)。当用户说'根据这次改动生成测试用例'、'给这个改动写回归测试'、'沉淀一条用例防回归'、'这个 bug 修复了加个视觉断言'、'生成 e2e 用例'、'补一条回归用例'、'这次改动影响了哪些地方'时使用。动作:生成、写、沉淀、补充、添加测试用例/回归用例/视觉断言/e2e 用例。对象:diff、commit、改动、bug 修复、cases.json、spec。Triggers: 生成用例、写测试、回归测试、视觉断言、防回归、根据改动、根据 diff、根据 commit、沉淀用例。"
metadata:
  scope: project
---

# tkt-test-gen

IRON LAW: 每条生成的用例必须能回答「它防住这次 diff 的哪个回归」。与改动无关的通用断言(「标题可见」「页面能打开」)是废品,直接作废;草稿必须人确认后才写回 spec/cases.json,禁止未确认入库。

## Workflow

Copy this checklist and check off items as you complete them:

```
tkt-test-gen Progress:

- [ ] Step 1: 读 diff,理解改了什么 ⚠️ REQUIRED
  - [ ] 1.1 确定 diff 范围(未提交 / 暂存 / 指定 commit)
  - [ ] 1.2 提炼「用户可见的变化」:改了哪个组件/页面/交互,渲染结果变在哪
- [ ] Step 2: 读项目现有 e2e/ 对齐风格 ⚠️ REQUIRED
  - [ ] 2.1 读现有 spec,对齐断言风格与命名习惯
  - [ ] 2.2 读 cases.json,对齐分组命名与 priority 分层
- [ ] Step 3: 判断影响面,生成用例草稿 ⚠️ REQUIRED
  - [ ] 3.1 列出受影响页面/交互
  - [ ] 3.2 每条草稿写「防哪个回归」+ 断言(不写回)
- [ ] Step 4: 人确认草稿 ⚠️ REQUIRED
- [ ] Step 5: 写回 spec + cases.json
```

## Step 1: 读 diff,理解改了什么 ⚠️ REQUIRED

先确定改动范围,再读 diff:

- 未提交:`git diff`
- 已暂存:`git diff --cached`
- 最近一次提交:`git diff HEAD~ HEAD`
- 指定提交:`git diff <commit>~ <commit>`

读完后回答三个问题(这是生成断言的前提,不是泛读):

1. **改了哪些文件** —— 组件 / 页面 / 样式 / 逻辑?
2. **改动的本质** —— 修 bug、加功能、调样式、改交互?哪种?
3. **渲染结果变在哪** —— 用户打开页面后,哪里看起来/行为上不一样了?

视觉回归测的是「渲染结果」,不是代码。改一个 z-index,断言要抓「不遮挡」;改一个溢出,断言要抓「不挤出屏幕」。只从 diff 提取「用户可见的变化」,代码内部实现(重构、变量改名)不生成视觉断言。

## Step 2: 读项目现有 e2e/ 对齐风格 ⚠️ REQUIRED

生成前先读项目 `e2e/` 现状,新用例要像项目里已有的用例,不另起炉灶:

- **spec 断言风格**:现有用例用确定性断言(`expect(locator).toBeVisible()`)还是视觉断言(`aiAssert('...')`)?新用例沿用同一 fixture import 与 beforeEach 结构。
- **cases.json 分组与分层**:现有 group 叫什么(冒烟/布局/主题…)?priority 用 P0/P1/P2 哪几档?新用例的 group/priority 对齐现有习惯。

对齐的具体规范见 `references/diff-to-assertion.md`。

## Step 3: 判断影响面,生成用例草稿 ⚠️ REQUIRED

Load `references/diff-to-assertion.md` for 影响面判断 + 断言写法 + P0/P1 分层。

对每条草稿,先写「**防哪个回归**」——这条用例抓的是 diff 里的哪个具体变化。断言必须与这个回归点直接对应。一次 diff 通常 1~5 条,不为「以后可能用到」的改动造用例。

草稿格式(不写回,列出来给人看):

```
用例名: <描述性,对齐现有 spec 风格>
防回归: <这次 diff 的哪个具体变化>
分层: P0(确定性) 或 P1(视觉 aiAssert)
断言: <expect(...) 或 aiAssert('自然语言')>
group / desc: <对齐 cases.json>
```

## Step 4: 人确认草稿 ⚠️ REQUIRED

列出草稿,问用户怎么处理:

- 全部入库?
- 只选其中几条?
- 某条改断言 / 改分层 / 改分组?
- 只看不写?

⚠️ 未确认,禁止写回 spec 或 cases.json。

## Step 5: 写回 spec + cases.json

确认后写回,规则:

- 新用例 **append** 到现有 spec(或按现有结构新建 spec),不覆盖已有用例
- cases.json 补新用例的 `group/priority/desc`,不破坏 JSON 格式,不与现有键冲突
- 保持 spec 的 `import { test, expect } from './fixture'` 结构不变

写回后输出验证命令(不代跑):

```
pnpm --dir <项目>/e2e exec playwright test
```

## Anti-Patterns

- 不生成通用断言(「标题可见」「页面能打开」)—— 抓不住回归,等于没测
- 不脱离项目现有 e2e/ 风格另起炉灶(命名、分组、断言风格要对齐)
- 不未确认就写回 spec/cases.json(半自动铁律)
- 不猜端口/登录态/后端依赖 —— 读项目现状,不确定就问
- 不为「以后可能用到」生成用例 —— 只针对本次 diff
- 不一次生成几十条 —— 一次 diff 通常 1~5 条

## Pre-Delivery Checklist

- [ ] 每条用例能回答「防住哪个回归」
- [ ] 断言与 diff 改动直接相关,非通用断言
- [ ] 对齐项目现有 spec 风格 + cases.json 分组/priority
- [ ] 草稿经过用户确认才写回
- [ ] cases.json 可 JSON 解析,spec 无占位符(TODO/xxx/{{}})
- [ ] 输出验证命令(不代跑)
