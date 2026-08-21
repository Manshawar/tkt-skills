# 白盒操作流测试方法论

功能完成后,像用户一样操作验证功能是否正确,不是只看静态布局。

## 1. 目录结构(按测试内容)

```
e2e/
├── fixture.ts / cases.json / playwright.config.ts / package.json
├── smoke/home.spec.ts           # 冒烟基线(P0 确定性,每次提交必绿)
├── platform/                    # 某页面/功能域
│   ├── page.spec.ts             # 页面功能(打开/分组/按钮/布局)
│   ├── nav.spec.ts              # 入口导航
│   ├── ui-*.spec.ts             # UI 交互(切换/搜索/增删/状态)
│   └── seeded.spec.ts           # 造数据(条件性展示)
└── manual/trigger.spec.ts       # 手动独立验证(触发 run 全链路,隔离)
```

- **manual/ 隔离**:会触发平台 run 的用例放 manual/,不进平台用例清单(防自循环)
- spec 移入子目录后,import 改为 `from '../fixture'`

## 2. 功能清单驱动(新页面合入必做)

**新页面/功能 → 先枚举全部功能点 → 逐项写测试 → 矩阵核对缺的补**。不是「测试绿了就算完成」,是「页面所有功能被验证」。

枚举来源:读代码 + agent-browser 探测**全部**可交互元素(按钮/输入/链接/切换/状态展示)。

每项落到一条测试;受约束/条件性不测的,标注原因。

## 3. 操作流写法(像用户一样)

```
导航 → 操作(点击/输入/发送)→ 断言用户可见结果
```

稳定定位(白盒),不用 AI 猜文本:
- `a[href="/test"]`、`getByRole('button', { name })`、`getByPlaceholder(...)`
- 歧义文本(「测试/测速」)必须用稳定选择器

断言结果:
- 确定性(`expect`)—— 元素增删/可见/文案,免费快
- `aiQuery` + `expect` —— 提取结构化数据(列表/文本),可靠 + 生成报告
- `aiAssert` —— 视觉判断(布局/遮挡/可读性),留证

## 4. 硬约束(踩坑沉淀)

- **防递归**:用例禁止点击会触发平台 run 的按钮(跑增量/跑全量/分组)。平台 run 会收集 spec 用例,点了自循环跑崩机器
- **固定范围**:跑测试用 `-g` 过滤一条/一组,不跑全量试错
- **重跑 ≤3**:失败→修复→重跑,超限停下人工判断
- **端口隔离**:被测 web 用专用端口(strictPort)+ 最新源码;防 `reuseExistingServer` 复用旧服务/误连(5173 曾被 zcode 占,复用了别人页面)
- **报告去重由 harness 管**:`midscene_run/report/` 每次跑完由 `e2e/scripts/cleanup-reports.ts`(playwright globalTeardown)按用例去重,每用例只留最新 1 个;tkt 平台不删源 report,只归档拷贝失败报告。新项目 init 模板应带此脚本(见 tkt-e2e-init)
- **综合模式在 fixture 配**:AI 操作深度/稳定性参数(`waitForNetworkIdleTimeout`/`waitAfterAction`/`replanningCycleLimit`)写 `e2e/fixture.ts`,不归 tkt 平台。判断/调法见 `midscene-api.md` 第 6 节
- **造数据测条件性**:失败理由/报告链接等条件展示,直接造 run 数据(临时目录 + finally 清理),不真触发 run

## 5. 跑 + 修复闭环

```bash
# 单条直跑(固定范围,不跑全量试错)
cd <项目>/e2e && ./node_modules/.bin/playwright test <spec路径> -g "<用例名>"

# 或走平台(按分组)
tkt test run <项目> -g <分组>
```

1. 隔离端口起被测服务(最新源码)
2. 单条 `-g` 跑(上面命令)
3. 红 → 读失败理由/截图定位 → 修复
4. 重跑同一条 ≤3
5. 绿 → 闭环,进入提交/回归

## 6. 分层判断

- **P0 确定性**:`expect(locator)` 能抓到 → 免费,进提交冒烟集
- **P1 视觉/交互结果**:必须 `aiQuery`/`aiAssert` → 调模型,进全量回归
- 拿不准问「`expect` 能确定抓到吗」,能则 P0,不能则 P1
