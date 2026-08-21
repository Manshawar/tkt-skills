# 覆盖率评估 + 坑记录(跑完一轮必做)

## 1. 覆盖率评估方法

**对照 `midscene_run/report/` 实际报告文件 vs cases.json 全部用例**,按「留证判定规则」逐条核对该不该有报告。

**核心原则**:报告数量 ≠ 用例数量。只有调用 midscene API 才生成带截图报告,纯 `expect` 无报告是**合理的**。所以评估不是「报告数越多越好」,而是「**该有报告的都有,不该有的没有**」。

| 用例类型 | 该有报告? | 依据 |
| --- | --- | --- |
| 操作流(导航/点击/切换/输入) | ✅ 必须 | 有「操作」→ 必须 `aiQuery`/`aiAssert` 留证 |
| 视觉类(布局/可读性/遮挡) | ✅ 必须 | `aiAssert` 留证 |
| 数据渲染(读列表/历史/状态展示) | ⬜ 可无 | 纯 `expect` 合理 |
| 条件展示(失败理由/报告链接) | ⬜ 可无 | 造数据 + `expect` 合理 |
| P0 确定性基线(标题/卡片/按钮存在) | ⬜ 可无 | 纯 `expect`,提交后必跑,不需审阅 |

**操作**:`ls e2e/midscene_run/report/`,得到有报告的用例名集合 → 对 cases.json 每条用例问「这条有『操作』吗」→ 有操作但无报告 = **缺口**(补 `aiQuery`/`aiAssert`);无操作无报告 = 正常。

**输出结论格式**:`报告覆盖率 N/M(有报告数/用例总数)` + 列出缺口用例 + 说明为什么其余无报告合理。

**报告页展示(归档闭环)**:上面对照的是**源目录** `e2e/midscene_run/report/`;报告页 `/test/report` 读的是**归档** `~/.config/tkt/test/runs/<项目>/run-*/`。要报告页看得到报告,须走 `tkt test run` 平台跑(触发 writeArchive 归档),`playwright test -g` 直跑只落源目录不归档,报告页看不到(见 `whitebox-flow.md` 第 5 节)。

## 2. 踩坑记录(playwright 跑测)

### 2.1 `-g` 传含 `/` 或 `?` 的正则报诡异错误
用例名带特殊字符(如「进入 /test」「?project=」)时,`playwright test -g "..."` 会报:
- `Error: No tests found` + 顺带一个误导性的 `did not expect test.beforeEach() to be called here`
- **这是 grep 正则匹配失败,不是 spec 坏了**。`--list` 仍能正常收集全部用例

**规避**:`-g` 只传不含特殊字符的子串(如「切换项目后用例清单刷新」),或直接用**行号定位** `playwright test platform/x.spec.ts:65`。行号从 `--list` 输出拿。

### 2.2 用例清单恒 0 检查「选中了哪个项目」
平台页默认选中 localStorage 记忆/第一个项目,**可能没有 e2e**(用例清单恒 0、无分组按钮)。测用例清单相关断言时,beforeEach 统一 `?project=<有用例的项目>` 显式指定,不靠默认。

### 2.3 切换项目断言不要用「用例数对比」
项目 A 有 e2e、项目 B 无 e2e,切换前后用例数可能都是 0(或相同),`before !== after` 必挂。改断言**选中态 class 变化**(active 按钮 class 含 `bg-primary`),语义稳。

### 2.4 造数据测条件展示
失败理由/报告链接等条件性展示,直接在归档目录写假 run 数据(`result.json` + `report/*.html`),UI 读归档展示,断言后 `finally` 清理。**不真触发平台 run**(防递归跑崩机器)。
