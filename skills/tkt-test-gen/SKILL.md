---
name: tkt-test-gen
description: "功能完成后,生成白盒操作流测试用例(像用户一样操作:导航/点击/输入/发送→断言可见结果),写回 e2e/ 的 spec + cases.json,半自动(草稿人确认后入库)。当用户说'测这个功能'、'功能做完了写个测试'、'给这次改动写测试'、'根据 diff 生成测试用例'、'沉淀一条用例防回归'、'这个 bug 修复了加个测试'、'走一遍这个流程'、'生成 e2e 用例'时使用。动作:测试、生成、写、沉淀、验证功能、操作流、白盒测试、走一遍。对象:diff、commit、改动、功能、bug 修复、cases.json、spec。Triggers: 生成测试、写测试、测功能、操作流、白盒、视觉断言、防回归、根据改动、根据 diff、根据 commit、沉淀用例、走一遍。"
metadata:
  scope: project
---

# tkt-test-gen

IRON LAW: 生成的用例必须「像用户一样操作,验证用户可见结果」——能回答「它防住这次改动的哪个回归 / 验证哪个功能」。与改动无关的通用断言(「标题可见」「页面能打开」)是废品。草稿必须人确认后才写回 spec/cases.json。**用例禁止触发平台自身 run(点「跑增量/跑全量/分组」按钮),会死循环跑崩机器。**

## Workflow

Copy this checklist and check off items as you complete them:

```
tkt-test-gen Progress:

- [ ] Step 0: 前置检查 e2e/ 是否已初始化 ⚠️ REQUIRED
  - [ ] 项目有 e2e/(playwright.config.ts + fixture.ts + cases.json)吗?
  - [ ] 没有 → 停下,引导先 /tkt-e2e-init,不硬写(新项目必须先 init)
- [ ] Step 1: 收集(读代码 + agent-browser 探测)⚠️ REQUIRED
  - [ ] 1.1 确定改动范围(未提交/暂存/指定 commit)
  - [ ] 1.2 提炼「用户可见的变化」:改了哪个组件/页面/交互
  - [ ] 1.3 agent-browser 打开目标页 snapshot -i 探测真实元素(按钮/href/输入框/标题/状态)
- [ ] Step 2: 读项目现有 e2e/ 对齐风格 ⚠️ REQUIRED
  - [ ] 2.1 读现有 spec,对齐 fixture import、命名、目录结构(smoke/platform/manual)
  - [ ] 2.2 读 cases.json,对齐 group 命名与 priority 分层
- [ ] Step 3: 判断影响面 + 生成草稿 ⚠️ REQUIRED
  - [ ] 3.1 列出受影响页面/交互(新页面 → 枚举全部功能点)
  - [ ] 3.2 每条草稿写「防哪个回归/验证哪个功能」+ 操作流 + 断言(不写回)
- [ ] Step 4: 人确认草稿 ⚠️ REQUIRED
- [ ] Step 5: 写回 spec + cases.json(按目录,append 不覆盖)
- [ ] Step 6: 跑(固定范围 -g 单条/一组)+ 修复(≤3)→ 再测
```

## Step 0: 前置检查 e2e/ ⚠️ REQUIRED

生成用例前先确认项目已初始化 e2e/。检查 `e2e/` 目录是否含 `playwright.config.ts` + `fixture.ts` + `cases.json`。

- 已初始化 → 继续 Step 1
- **未初始化 → 停下,引导先 `/tkt-e2e-init`**,不硬写 spec(新项目必须先 init 生成骨架 + 装依赖 + 配 MIDSCENE_MODEL_*)

## Step 1: 收集(读代码 + 探测)⚠️ REQUIRED

先读改动,再**用 agent-browser 探测真实页面**,不猜。

读 diff 回答三个问题:
1. **改了哪些文件** —— 组件/页面/样式/逻辑?
2. **改动本质** —— 修 bug、加功能、调样式、改交互?
3. **渲染结果变在哪** —— 用户打开页面后哪里不一样了?

探测目标页:
```bash
agent-browser open <url>          # 打开被测页
agent-browser snapshot -i          # 拿真实元素(按钮文案/href/输入框占位/标题/状态)
```

**探测产出 = 稳定定位依据**。断言只建立在探测到的元素上,探测不到/不确定就标记待探测,不猜。教训:`aiTap('"测试" 工具卡片')` 会误点「测速」(文本歧义);改 `a[href="/test"]` 稳定定位一次通过。

## Step 2: 读项目现有 e2e/ 对齐 ⚠️ REQUIRED

Load `references/whitebox-flow.md` for 目录结构、功能清单驱动、断言写法。

- 目录按内容:smoke(冒烟基线)、platform(平台页)、manual(手动/触发 run 独立验证,不进平台 run)
- cases.json:group(冒烟/回归/主题…)对齐现有,priority 用 P0/P1/P2

## Step 3: 生成草稿 ⚠️ REQUIRED

Load `references/whitebox-flow.md`(操作流写法)+ `references/midscene-api.md`(API 全貌 + 留证)。

每条草稿格式(不写回):

```
用例名: <描述性,对齐现有 spec>
防回归/验证: <这次改动的哪个具体变化/功能>
操作流: <导航→点击→输入→发送 步骤>
断言: <expect(...) 或 aiQuery(...) 或 aiAssert('...')>
group / priority / desc: <对齐 cases.json>
```

**操作流优先,断言抓结果**:像用户一样走(点新增按钮→填输入框→发送→看结果)。关键功能用 `aiQuery` 提取数据 + `expect`(可靠 + 生成报告),不押在单一 `aiAssert` 视觉判断上(有非确定性)。确定性断言保留(快速红绿),`aiQuery`/`aiAssert` 补上留证(报告可审阅功能)。

## Step 4: 人确认草稿 ⚠️ REQUIRED

列出草稿,问:全部入库?选几条?改断言/分层/分组?只看不写?未确认禁止写回。

## Step 5: 写回 spec + cases.json

- 按目录 append 到现有 spec(或按结构新建),不覆盖
- cases.json 补 group/priority/desc,不破坏 JSON、不与现有键冲突
- 保持 fixture import 结构不变

## Step 6: 跑 + 修复

Load `references/whitebox-flow.md` 的「跑 + 修复」节。核心:固定范围 `-g` 单条,不跑全量试错;红了读失败理由/截图修,重跑 ≤3 次。

## Anti-Patterns

- 猜 DOM/文本,不 agent-browser 探测
- `aiTap` 用自然语言猜文本(「测试/测速」歧义),不用稳定定位
- 关键功能押在单一 `aiAssert` 视觉判断(非确定性),不用 `aiQuery`+`expect`
- **用例触发平台自身 run(点跑增量/分组),死循环跑崩机器**
- 跑全量试错,不固定范围 `-g`
- 测试绿了就以为完成,不核对「功能清单全枚举」
- 生成通用断言(「标题可见」「页面能打开」)
- 未确认就写回 spec/cases.json
- 报告重复堆积(跑前不清 `midscene_run/report/`)

## Pre-Delivery Checklist

- [ ] 每条用例能回答「防哪个回归 / 验证哪个功能」
- [ ] 白盒定位(稳定选择器),非 AI 猜文本
- [ ] 关键功能用 `aiQuery`+`expect` 留证(生成报告可审阅)
- [ ] 用例不触发平台自身 run
- [ ] 新页面功能全枚举(功能清单驱动,非想到哪测到哪)
- [ ] 目录按内容(smoke/platform/manual),cases.json 已登记
- [ ] 草稿经用户确认才写回
- [ ] 输出验证命令(固定范围 -g,不代跑全量)
