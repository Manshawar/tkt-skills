# SSO 登录链与 e2e 模板

线上部署页面（无本地 dev server）的测试初始化模板。所有 `{{占位}}` 必须用 Step 1/2 识别到的真实值替换,不是照抄。

## 文件清单

```
<project>/e2e/
├── package.json              # 隔离子工程,自含依赖
├── playwright.config.ts      # baseURL=线上 URL + storageState,无 webServer
├── fixture.ts                # Midscene fixture
├── auth.setup.ts             # 真实 SSO 登录 → 存登录态
├── <name>.spec.ts            # 复用登录态 + 视觉断言
└── .env                      # 线上 URL + 测试账号(项目本地,不入库)
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

**独立 node_modules,不碰主项目依赖。**

## playwright.config.ts

```ts
import { defineConfig } from '@playwright/test'
import dotenv from 'dotenv'
dotenv.config()

export default defineConfig({
  testDir: './',
  workers: 1,
  reporter: [['list'], ['@midscene/web/playwright-reporter']],
  use: {
    baseURL: process.env.ONLINE_URL,   // 后台/运维提供的线上地址,不是猜的
    storageState: '{{stateFile}}',      // 登录态,auth.setup 产出后复用
  },
  // 无 webServer——页面已在线上跑
})
```

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

## auth.setup.ts（真实 SSO 登录,存登录态）

```ts
import { test as setup, expect } from '@playwright/test'

setup('SSO 登录并保存登录态', async ({ page }) => {
  // 1. 打开后台登录页(可能与被测页不同源)
  await page.goto(process.env.SSO_LOGIN_URL)
  // 2. 填测试账号
  await page.getByLabel('账号').fill(process.env.SSO_USERNAME)
  await page.getByLabel('密码').fill(process.env.SSO_PASSWORD)
  await page.getByRole('button', { name: '登录' }).click()
  // 3. 登录后跳转链:点"去后台"类入口 → 平台注入 code → 跳实际页面
  await page.getByRole('button', { name: '{{enterEntry}}' }).click()
  // 4. 等跳转到被测页,确认登录成功
  await page.goto(process.env.ONLINE_URL)
  await expect(page.locator('body')).not.toContainText('登录')
  // 5. 保存登录态
  await page.context().storageState({ path: '{{stateFile}}' })
})
```

`账号`/`密码`/`{{enterEntry}}` 选择器按真实页面适配,不猜。

## 业务 spec（复用登录态）

```ts
import { test, expect } from './fixture'

test.use({ storageState: '{{stateFile}}' })

test('P0 页面加载', async ({ page }) => {
  await page.goto(process.env.ONLINE_URL)
  await expect(page.locator('{{selector}}')).toBeVisible()
})

test('P1 关键流程', async ({ page, aiAssert }) => {
  await page.goto(process.env.ONLINE_URL)
  await aiAssert('{{自然语言断言:页面关键区域长成什么样}}')
})
```

## .env（项目本地,不入库）

```
SSO_LOGIN_URL=<后台登录页>
SSO_USERNAME=<测试账号>
SSO_PASSWORD=<测试密码>
ONLINE_URL=<被测线上页面>
```

Midscene 模型配置同样用户自填四项(`MIDSCENE_MODEL_BASE_URL/API_KEY/NAME/FAMILY`),值来自模型服务商控制台。

> **只读约束**:线上模式一律无副作用(不提交/不删除/不写库)。需写操作的用例标 P2 默认 skip,人工确认后手动跑。
