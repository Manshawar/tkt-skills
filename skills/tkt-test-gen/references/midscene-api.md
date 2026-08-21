# Midscene API 全貌 + 留证

参考:midscenejs.com/zh/integrate-with-playwright + 官方示例 midscene-example/playwright-testing-demo(todo-mvc / ebay-search)。

## 1. 功能操作流 API(不只 aiTap + aiAssert)

| API | 用法 |
| --- | --- |
| `ai('自然语言多步操作')` | 一句话完成操作:`ai('在任务框输入 X 并回车')` |
| `aiInput('text', locate)` | 输入文字到元素 |
| `aiTap(locate)` | 点击 |
| `aiWaitFor('条件', {timeoutMs})` | 等待操作结果出现 |
| `aiQuery<T>('提取结构化数据')` | 提取数据 + `expect` 断言(可靠留证) |
| `aiAssert('可见状态')` | 断言用户可见状态 |
| `aiScroll` / `aiRightClick` | 滚动 / 右键 |
| `recordToReport('名称', {...})` | 显式留证 |

**功能操作流范式**(todo-mvc 参考):
```ts
await aiInput('Headphones', '搜索框')      // 输入
await aiTap('搜索按钮')                     // 点击
await aiWaitFor('搜索结果列表已加载')        // 等结果
const items = await aiQuery('商品标题和价格') // 提取数据
expect(items?.length).toBeGreaterThan(0)   // 断言数据
await aiAssert('界面左侧有类目筛选功能')      // 验证可见状态
```

## 2. aiQuery 比 aiAssert 可靠(关键教训)

- `aiAssert('列表出现目录')` 有视觉非确定性(描述与视觉不贴会误判)
- 改用 `aiQuery<string[]>('目录路径列表')` + `expect(some includes)` —— 确定性 + 仍生成报告
- **关键功能验证优先 aiQuery+expect;aiAssert 仅作留证/宽松视觉描述**

## 3. 留证 = 报告可审阅功能

- 只有调用 midscene API(`ai`/`aiInput`/`aiTap`/`aiQuery`/`aiAssert`)才生成带截图报告
- 纯确定性断言(`expect`/`getByRole`)不调 midscene → 无报告,功能成功与否不可审阅
- **功能操作流的关键断言用 aiQuery/aiAssert 留证**,报告里就有「操作 + 截图」,可审阅功能是否成功

## 4. 报告挂载机制

- midscene 每跑一条用例,在 `midscene_run/report/` 生成带用例名 HTML(separate 保留 per-test,merged 会删)
- 平台按用例名匹配,把「终端红字」和「带截图报告」接上:`result.json` 每用例 `report` 字段 → 前端「报告」链接
- 每轮结果存 `runs/<项目>/run-<ts>/result.json`,保留最近 50 轮

## 5. 其他

- 偶发慢/超时:aiAssert 偶发 30s 超时(视觉模型慢),骨干测试重试 ≤3
- fixture 配置:`waitForNetworkIdleTimeout`、`replanningCycleLimit`、`modelConfig`

## 6. 综合模式(fixture 配置,e2e 层自管)

**midscene 的 AI 操作深度/稳定性由 e2e 项目自己的 fixture.ts 配置,不归 tkt 平台管。** tkt 只负责执行用例、归档结果;「综合模式」= 调大这些参数让 AI 综合操作更稳更全,写进 `e2e/fixture.ts` 的 `PlaywrightAiFixture({...})`,随项目走,不影响平台。

常用可配参数(来自 `@midscene/web` `WebPageAgentOpt` + `AgentOpt`):

| 参数 | 默认 | 作用 | 综合模式建议 |
| --- | --- | --- | --- |
| `waitForNetworkIdleTimeout` | 2000ms | 操作后等网络空闲,防页面未加载完就断言 | 页面重的项目调 3000~5000 |
| `waitForNavigationTimeout` | 5000ms | 跳转等待上限 | 默认即可 |
| `replanningCycleLimit` | 20 | AI 操作失败后重新规划的最大次数(深度) | 关键复杂流程调 30~40 |
| `waitAfterAction` | 300ms | 每个动作后的稳定等待 | 动画多的页面调 500~800 |
| `modelConfig` | 读 .env | 指定模型;默认读 MIDSCENE_MODEL_* | 不常用 |
| `cache` | true | AI 结果缓存(同 id 复用),省 token 提速 | 调试期可关,回归期开 |

**示例**(`e2e/fixture.ts`):
```ts
export const test = base.extend<PlayWrightAiFixtureType>(
  PlaywrightAiFixture({
    cache: { id: '{{name}}' },
    waitForNetworkIdleTimeout: 3000,
    waitAfterAction: 500,
    replanningCycleLimit: 30,
  }),
)
```

**判断要不要调大(综合模式)**:用例里出现「元素找不到/点不到/断言超时」且是**页面加载慢或动画未稳定**导致的 → 调大 `waitForNetworkIdleTimeout` / `waitAfterAction`;是 **AI 操作路径复杂、一步失败就中断** → 调大 `replanningCycleLimit`。纯断言逻辑问题不靠调参解决,先修用例。

**防坑**:参数是 e2e 项目配置,改了要重跑验证;不要在 tkt 平台代码里硬编码这些,平台只读结果。
