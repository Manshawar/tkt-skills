# E2E Scaffold

隔离 e2e/ 子工程的文件清单 + 生成规则 + 模板。所有 `{{占位}}` 必须用 Step 1/2 识别到的真实值替换,不是照抄。

## 文件清单

```
<project>/e2e/
├── package.json              # 隔离子工程,自含依赖
├── playwright.config.ts      # projects 多前端 + webServer.cwd + 真实端口 + json reporter
├── fixture.ts                # Midscene fixture
├── <name>.spec.ts            # 用例(含登录态注入/路由目标/后端探测)
├── cases.json                # 分组/优先级(必选,tkt 测试平台靠它分组触发)
└── .env                      # Midscene 模型配置(用户自填 MIDSCENE_MODEL_* 四项)
```

## package.json

```json
{
  "name": "<project>-e2e",
  "private": true,
  "type": "module",
  "scripts": { "test": "playwright test" },
  "devDependencies": {
    "@midscene/web": "^1.11.0",
    "@playwright/test": "^1.62.1",
    "dotenv": "^17.4.2"
  }
}
```

依赖版本:优先对齐项目内已有 playwright/midscene 版本;没有则用上面推荐版。**独立 node_modules,不碰主项目依赖。**

## playwright.config.ts

单前端:

```ts
import { defineConfig } from '@playwright/test'
import dotenv from 'dotenv'
dotenv.config()

export default defineConfig({
  testDir: './',
  workers: 1,
  reporter: [
    ['list'],
    // separate:tkt 测试平台按用例挂报告,需保留 per-test 报告(merged 模式会删除)
    ['@midscene/web/playwright-reporter', { type: 'separate' }],
    ['json', { outputFile: 'midscene_run/last-run.json' }],
  ],
  use: { baseURL: '{{realPort}}' },
  webServer: {
    cwd: '{{frontendSubdir}}',     // 前端子目录绝对/相对路径,不是项目根
    command: '{{startCommand}}',   // 如 pnpm dev --port 5174
    url: '{{realPort}}',
    reuseExistingServer: true,
  },
})
```

要点:`reporter` 配 `separate`(per-test 报告保留,tkt 平台挂载用例报告——所有用例都挂,不限于失败;报告=页面操作覆盖证明)+ `json` 固定输出 `midscene_run/last-run.json`(平台跑完读取解析)。`tkt test run` 不覆盖 reporter,直接吃 config 这份配置。

多前端(monorepo):用 `projects` 数组,每个前端一个 project:

```ts
export default defineConfig({
  projects: [
    { name: 'web', use: { baseURL: 'http://localhost:5174' } },
    { name: 'mobile', use: { baseURL: 'http://localhost:5173' } },
  ],
  webServer: [
    { cwd: '{{webSubdir}}', command: '{{webCmd}}', url: 'http://localhost:5174', reuseExistingServer: true },
    { cwd: '{{mobileSubdir}}', command: '{{mobileCmd}}', url: 'http://localhost:5173', reuseExistingServer: true },
  ],
})
```

要点:

- `webServer.cwd` = 前端子目录(启动命令在子目录执行),不是项目根 —— monorepo 根跑 `pnpm dev` 必失败
- `workers: 1`(Midscene 视觉断言串行,防并发打爆模型)
- `reuseExistingServer: true`:已在跑则复用,没跑则 playwright 起、跑完收

## fixture.ts

```ts
import { test as base } from '@playwright/test'
import type { PlayWrightAiFixtureType } from '@midscene/web/playwright'
import { PlaywrightAiFixture } from '@midscene/web/playwright'

export const test = base.extend<PlayWrightAiFixtureType>(
  PlaywrightAiFixture({ cache: { id: '{{projectName}}' } }),
)
export { expect } from '@playwright/test'
```

`cache.id` 用项目名,同一项目跨 run 复用「定位/规划」缓存(断言永不缓存)。

## <name>.spec.ts

骨架必须编码 Step 2 识别到的运行时,不是通用断言:

```ts
import { test, expect } from './fixture'

// 1. 登录态注入(如识别到需要)
const injectAuth = () => {
  localStorage.setItem('{{tokenKey}}', '{{fakeToken}}')
  sessionStorage.setItem('{{persistKey}}', JSON.stringify({ /* 项目 state 结构 */ }))
}

// 2. 后端探测(如识别到后端依赖)
const ping = (port: number) => /* ... */

test.beforeEach(async ({ page }) => {
  await page.addInitScript(injectAuth)   // 有登录态才需要
  await page.goto('{{routePath}}')       // 目标页真实路由,如 /#/ai-demo
  await page.waitForLoadState('domcontentloaded')
})

test('P0 页面加载冒烟', async ({ page }) => {
  // 基线:不依赖后端,每次提交必须绿。用确定性断言(元素可见/文案),不依赖视觉
  await expect(page.locator('{{selector}}')).toBeVisible()
})

test('P1 交互', async ({ page, aiAssert }) => {
  // 依赖后端/复杂交互。beforeAll 里 ping 不通则 test.skip()
  await aiAssert('{{自然语言断言:页面长成什么样子}}')
})
```

分层约定:

- **P0**:不依赖后端/登录的基线冒烟,用确定性断言(`expect(locator)`),免费快
- **P1**:依赖后端/需要视觉判断,用 `aiAssert`(每次调模型,有成本)

## cases.json(必选)

**必须生成**:`tkt test` 平台读它合成用例清单、按分组触发(-g 过滤到 Playwright 原生能力)。缺失则平台无法分组,用例归「未分组」。每个 spec 里 `test("...")` 的用例名都应在此登记分组/优先级:

```json
{
  "P0 页面加载冒烟": { "group": "首页", "priority": "P0", "desc": "基线,每次提交必须绿", "files": ["web/src/pages/home.tsx"], "spec": "home.spec.ts" },
  "P1 复杂交互": { "group": "首页", "priority": "P1", "desc": "依赖后端,视觉断言", "files": ["web/src/pages/*.tsx"], "spec": "home.spec.ts" }
}
```

约定:group=功能域(页面+关联页面,如 `首页`/`测试平台`),priority=质量分层(P0确定性/P1深层),files=用例断言的源码 glob(diff 选例地基:改了这些文件冒烟就跑这条用例),spec=用例所在 spec 文件名(改该 spec 文件冒烟跑该 spec 全部用例)。平台 UI 按 group 展示与触发。

**存量项目回填**:已有 e2e/cases.json 但缺 `files`/`spec` 字段时,逐条回填(不重写整个文件):`files` 用源码 glob(断言精确文案精确到文件,如 `web/src/pages/home.tsx`;其余目录级 `web/src/pages/*.tsx`),`spec` 用该用例所在 spec 文件名(如 `home.spec.ts`)。纯文档/注释不登记 files。

## .env

用户自填,写 `MIDSCENE_MODEL_BASE_URL/API_KEY/NAME/FAMILY` 四项(值来自模型服务商控制台,不拷贝任何既有 CLI 配置)。模型家族与 provider 不对应时调 `MIDSCENE_MODEL_FAMILY`。
