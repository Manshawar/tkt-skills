# 覆盖率评估 + 坑记录(跑完一轮必做)

覆盖率有两层,先 1 后 2。只做第 2 层 = 没完成。判覆盖/拆行规则以 `whitebox-flow.md` §2 为准,此处只做收口。

## 1. 功能点覆盖率(完成门)

**对照 Step 3 已选定方向的矩阵 vs 写回后的 cases.json**,不是对照报告文件数,也不是重新全站 `snapshot` 当新分母。

分母 = 选定方向矩阵行数(含拆行后的操作/直达)。A < B 且缺口没有「不测原因」→ 未完成,回去补草稿。

**输出**:`功能点覆盖率 A/B(已覆盖行/清单行)` + 缺口表。然后按 SKILL Step 6b 输出本次测试说明,不要只报数字。

## 2. 报告留证覆盖率

**对照 `e2e/midscene_run/report/` 实际报告文件 vs cases.json 全部用例**,按「留证判定规则」逐条核对该不该有报告。

**核心原则**:报告数量 ≠ 用例数量,更 ≠ 功能点数量。只有调用 midscene API 才生成带截图报告,纯 `expect` 无报告是**合理的**。所以这一层不是「报告数越多越好」,而是「**该有报告的都有,不该有的没有**」。

| 用例类型 | 该有报告? | 依据 |
|---|---|---|
| 操作流(导航/点击/切换/输入) | ✅ 必须 | 有「操作」→ 必须 `aiQuery`/`aiAssert` 留证 |
| 视觉类(布局/可读性/遮挡) | ✅ 必须 | `aiAssert` 留证 |
| 数据渲染(读列表/历史/状态展示) | ⬜ 可无 | 纯 `expect` 合理 |
| 条件展示(失败理由/报告链接) | ⬜ 可无 | 造数据 + `expect` 合理 |
| P0 确定性基线(标题/卡片/按钮存在) | ⬜ 可无 | 纯 `expect`,提交后必跑,不需审阅 |

**操作**:`ls e2e/midscene_run/report/`,得到有报告的用例名集合 → 对 cases.json 每条用例问「这条有『操作』吗」→ 有操作但无报告 = **留证缺口**(补 `aiQuery`/`aiAssert`);无操作无报告 = 正常。

**输出结论格式**:`报告覆盖率 N/M(有报告数/用例总数)` + 列出缺口用例 + 说明为什么其余无报告合理。

**报告页展示(归档闭环)**:源目录 `e2e/midscene_run/report/` vs 归档 `~/.config/tkt/test/runs/<项目>/run-*/`。生成代跑只落源目录;要验归档才 `tkt test run`。功能点以页面上实际能点到的工作台/报告链为准,不要只认归档字段(见 `whitebox-flow.md` §5)。

## 3. 踩坑记录(playwright 跑测)

### 3.0 必须在 `e2e/` 里跑,仓库根 `npx playwright` 会假报 beforeEach
e2e 是隔离子工程(自己的 `package.json` / `node_modules` / `playwright.config.ts`)。在**仓库根**跑 `npx playwright test platform/...` 会打到根目录那份 `@playwright/test`(若根 `package.json` 也声明了它),而 spec 的 `test` 来自 `e2e/fixture.ts` → 两份 Playwright,报:

- `did not expect test.beforeEach() to be called here`(指向 spec 的 `test.beforeEach`)
- 紧跟 `Error: No tests found`

这不是 spec 坏了,也不是 `-g` 没命中。`--list` 在 `e2e/` 下仍能收集。

**规避**(Windows 同样):

```bash
cd e2e
npx playwright test platform/test-platform.spec.ts -g "报告页点选"
```

或在仓库根:`pnpm --dir e2e exec playwright test platform/test-platform.spec.ts -g "报告页点选"`

### 3.1 `-g` 传含 `/` 或 `?` 的正则报诡异错误
用例名带特殊字符(如「进入 /test」「?project=」)时,`playwright test -g "..."` 会报:
- `Error: No tests found` + 顺带一个误导性的 `did not expect test.beforeEach() to be called here`
- **这是 grep 正则匹配失败,不是 spec 坏了**。`--list` 仍能正常收集全部用例

**规避**:`-g` 只传不含特殊字符的子串(如「切换项目后用例清单刷新」),或直接用**行号定位** `playwright test platform/x.spec.ts:65`。行号从 `--list` 输出拿。

### 3.2 用例清单恒 0 检查「选中了哪个项目」
平台页默认选中 localStorage 记忆/第一个项目,**可能没有 e2e**(用例清单恒 0、无分组按钮)。测用例清单相关断言时,beforeEach 统一 `?project=<有用例的项目>` 显式指定,不靠默认。

### 3.3 切换项目断言不要用「用例数对比」
项目 A 有 e2e、项目 B 无 e2e,切换前后用例数可能都是 0(或相同),`before !== after` 必挂。改断言**选中态 class 变化**(active 按钮 class 含 `bg-primary`),语义稳。

### 3.4 造数据测条件展示
规则见 `whitebox-flow.md` §4「造数据测条件性」,此处不重复。

### 3.5 用例名会进工作台导航,模糊 role 会撞名
工作台左侧 `nav button` 的 accessible name 就是用例名。`getByRole('button', { name: /返回/ })` 会同时命中顶条「← 返回」和「操作流:工作台返回报告页」。用 `exact: true` 钉死顶条文案(如 `name: '← 返回'`)。
