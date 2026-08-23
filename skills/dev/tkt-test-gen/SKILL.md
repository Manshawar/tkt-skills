---
name: tkt-test-gen
description: "功能完成后,生成白盒操作流测试用例(像用户一样操作:导航/点击/输入/发送→断言可见结果),写回 e2e/ 的 spec + cases.json,半自动(草稿人确认后入库)。当用户说'测这个功能'、'功能做完了写个测试'、'给这次改动写测试'、'根据 diff 生成测试用例'、'沉淀一条用例防回归'、'这个 bug 修复了加个测试'、'走一遍这个流程'、'生成 e2e 用例'时使用。动作:测试、生成、写、沉淀、验证功能、操作流、白盒测试、走一遍。对象:diff、commit、改动、功能、bug 修复、cases.json、spec。Triggers: 生成测试、写测试、测功能、操作流、白盒、视觉断言、防回归、根据改动、根据 diff、根据 commit、沉淀用例、走一遍。"
metadata:
  scope: project
---

# tkt-test-gen

IRON LAW: 用例必须像用户操作并断言可见结果,能回答「防住这次改动的哪条回归」。通用「标题可见」是废品。草稿经人确认才写回。**禁止点冒烟/全量/分组**(平台会再跑 spec,死循环)。

**验收方向由人定。** 有工作史先归纳;git `--stat` 只核对夹带、用来出选项。没选定禁止探测、禁止写矩阵、禁止读文件级 diff。整页重枚举只在用户勾了「该页交互模型变了」;全站换 token ≠ 旧操作流全测。

**封闭选择走点选,不要写进聊天正文。** Step 1.2 / Step 4 是有限项、模型先填满、可多选。本回合工具列表里若有结构化选择题,用它弹出选项让用户点,不要在普通回复里贴 A/B/C 或「全入?删哪条?」(正文一写出选项,点选节点就不会出现)。没有该工具时,再用同一组已填满的选项在聊天里问。开放题(怎么测、改哪句断言)不要用点选。6b 是写给用户看的报告,不是表单。

矩阵只覆盖已选定方向。可交互点拆行(存在/操作/直达/条件展示)。基线 `toBeVisible`、别的用例前置步骤不算覆盖。缺口且无不测原因 → 入库。

按需 Load(不要一次全读):
- Step 2: `references/whitebox-flow.md` §1、§2.5
- Step 3: 同文件 §2–3 + `references/midscene-api.md` §1–3
- Step 6 跑测: 同文件 §4–5；超时且像加载/动画未稳才读 midscene-api.md §6
- Step 6 跑完 / 提交前: `references/coverage-review.md`

## Workflow

```
tkt-test-gen Progress:

- [ ] Step 0: 前置检查 e2e/ ⚠️ REQUIRED
  - [ ] 有 e2e/(playwright.config.ts + fixture.ts + cases.json)? 没有 → /tkt-e2e-init,停
- [ ] Step 1: 收集 ⚠️ REQUIRED
  - [ ] 1.1 改动本质(有工作史先归纳;无历史才用 git 名单聚类)
  - [ ] 1.2 出验收选项(封闭点选) ⛔ 未选则停止;已选则留底并继续
  - [ ] 1.2b 人选定方向 ⛔ BLOCKING
  - [ ] 1.3 只探选定路由:snapshot -i + 读代码(直达/条件展示)
- [ ] Step 2: 对齐现有 e2e/ ⚠️ REQUIRED
- [ ] Step 3: 矩阵 + 草稿 ⚠️ REQUIRED(不写回)
- [ ] Step 4: 确认入库(封闭点选) ⚠️ REQUIRED
- [ ] Step 5: append spec + cases.json
- [ ] Step 6: 代跑 -g + 修 ≤3 → Load coverage-review.md
- [ ] Step 6b: 输出本次测试说明(测试点+期望值) ⚠️ REQUIRED(跑完或提交前)
```

## Step 0

无 `e2e/playwright.config.ts` + `fixture.ts` + `cases.json` → 引导 `/tkt-e2e-init`,不硬写。

## Step 1

禁止整份 `git diff` 进上下文。顺序锁死:**归纳 → stat 填满选项 → 封闭点选停下 → 人选 → 再探测/再读文件 diff**。

**1.1 历史优先**

1. 有本轮对话 → 1~3 句归纳意图。文件多盖不过这句话。
2. 无历史(新会话 / 只给了 commit /「按 diff 测」) → 用 1.2 三份名单聚类。

归纳三问:主变化是哪一件;本质(bug/功能/样式/交互);stat 大但史没提的路径 → 选项里标「默认不推荐」。

**1.2 出选项(只用名单,不通读) ⛔**

`git status --short` + `git diff --stat` + `git diff --cached --stat`。抓夹带和「声称改了但没有」。

先在内部填满 3~5 项,再作为**封闭选择题**问用户(可多选),然后停下。禁止探测/写矩阵/`git diff -- <file>` 直到人选完。本轮已选定 → 选项仍留底,不再问第二次,进 1.2b/1.3。

选项内容(填实,禁止空占位;问的时候用点选,不要把下面抄进聊天当问卷):

- 主变化:测 操作+可见结果 / 不测 易跑偏旧交互。标推荐
- 次要相关:一句测什么
- stat 扫到但非主变化:标默认不推荐
- 至多一个「其他,我补充」作逃生

- 主题开关/顶栏单独成项,不并进业务页
- 多页只换 token → 「切主题 + 抽检」,不是每页整页重测
- 新控件/排序/信息架构 → 才给整页重枚举
- 主变化必须在选项里

**1.2b ⛔** 未选定禁止 1.3。本轮用户已经明确选定(如「就测 A+B」) → 不要再停一次,把已选写入方向后进 1.3。未选方向在矩阵写「本次不测:用户未选」。禁止为迁就 `aiAssert` 锁死要验的状态(主题却 `beforeEach` 写死 dark)。

**1.3 人选之后** 才:

1. 需要写断言时才 `git diff -- <选定相关文件>`
2. 只探选定路由(含该方向关联页):
```bash
agent-browser open <url>
agent-browser snapshot -i
```
3. **直达/条件展示读代码**(searchParams、条件渲染)。snapshot 里没有 `?case=`。条件展示造数据(临时目录 + finally 清理),不真触发平台 run。

产出:稳定选择器(禁止猜「测试/测速」,用 `a[href="/test"]`);功能点分列——存在 / 操作 / 直达 / 条件展示。没选的页不探。

## Step 2

Load `references/whitebox-flow.md` §1、§2.5。读现有 spec 的 import/命名;列出 cases.json 已有用例名/group/P0·P1,供 Step 3「已有用例」列对照。group=功能域,冒烟/全量是执行粒度。priority 只写 `P0` 或 `P1`(与 cases.json 一致)。

## Step 3

Load `references/whitebox-flow.md` §2–3(矩阵/判覆盖/操作流)+ `references/midscene-api.md` §1–3(留证 API)。**矩阵规则只在 whitebox §2,此处不另写一套。** 没有矩阵禁止出草稿。

草稿(不写回):

```
用例名 / 防回归 / 操作流
测试点: <这一条验什么>
期望值: <操作后用户必须看见什么(文案/状态/选中/列表变化)>
断言: <expect / aiQuery+expect / aiAssert>
group=当前功能域(默认取本次主变化页面归属域;优先复用 cases.json 已有 group,无则新建;勿写冒烟)  priority=P0|P1
files: 断言源码 glob(目录级或精确到文件;纯文档不登)
spec: 所在 spec 文件名(改 spec → 冒烟跑该文件全部)
```

有操作 → 操作后必须 `aiQuery`+`expect` 或 `aiAssert`。只读数据 → `expect` 够。

## Step 4

出示选定方向的矩阵 + 入库草稿(每条必须带测试点、期望值)。用**封闭点选**确认入库,选项由模型按草稿填满,例如:全部入库(推荐)、去掉某条、只看不写。未确认禁止写回。此处不再改方向。禁止问「删哪条?改断言?」这种开放填空。

## Step 5

append,不覆盖 spec;补 cases.json 键,不撞名;保持 fixture import 结构。

## Step 6

Load `references/whitebox-flow.md` §4–5。自己跑,不丢命令。必须在 `e2e/`(或 `pnpm --dir e2e exec playwright test`)。

- 默认只跑入库范围。`-g` 用不含 `/` `?` 的子串;多条 `-g "A|B|C"`(PowerShell 必须给 grep 加引号)
- 用户明确说全跑/验收该 spec → 跑该 spec 整文件,仍禁止点 UI run
- 红了读失败理由/截图再修,同一条 ≤3
- 被测服务用专用端口,防 `reuseExistingServer` 连到别人的页

跑完 Load `references/coverage-review.md`:对照 **Step 3 矩阵**(不要重新全站 snapshot 当新分母)。输出功能点覆盖率 A/B + 报告覆盖率 N/M + 两份缺口。只报报告层 = 没完成。

**Step 6b 本次测试说明 ⚠️ REQUIRED**(代跑结束,或用户要提交/收工、即使没再跑一遍):禁止只丢覆盖率数字或「都绿了」。按入库范围逐条交代,格式:

```
本次测试说明
方向: <用户选定的验收方向>
| 用例 | 测试点 | 期望值 | 结果 |
| <名> | <验什么> | <必须看见什么> | 绿 / 红:<原因> / 未跑 |
覆盖: 功能点 A/B · 报告 N/M
```

期望值必须是用户可见结果(文案、选中态、列表顺序、条件区块出现),不是「断言通过」。未跑也要列出测试点+期望值,结果写「未跑」。

## Anti-Patterns

- 把 A/B/C 或「全入?删哪条?」写进普通回复(有点选工具时会跳过选项节点)
- 没出选项就探测/写矩阵;有工作史还先吞 git 名单;整份 `git diff` 进上下文
- 猜 DOM;`aiTap` 猜文案;操作流只 `expect` 不留证;关键路径只靠一次 `aiAssert`
- 点冒烟/全量/分组;仓库根 `npx playwright`;主题工作锁死 dark
- 跑前清空 `midscene_run/report/`;源 HTML 只增不删(keep=50, prune 按 mtime)
- 用「基线已有按钮」把操作/直达踢出矩阵;group 不取当前功能域、写成冒烟/回归或凭空发明新域(先复用 cases.json 已有 group)
- 条件展示去点平台 run;Step 6 默认走 `tkt test run`(归档链路才用,生成代跑用 playwright `-g`)
- 跑完/提交只报覆盖率或「都绿了」,不交代测试点与期望值

## Pre-Delivery Checklist

- [ ] 1.2 / 4 用封闭点选问过(有选择题工具时没把 A/B/C 写进普通回复);用户已选;矩阵未用基线/前置顶操作
- [ ] 入库=缺口且无不测原因;人确认后才写回;files/spec 已登;group 是功能域
- [ ] 已代跑(或提交前未再跑已标明);两层覆盖率已输出且缺口已补
- [ ] 已向用户交代本次测试说明:每条测试点 + 期望值 + 结果
