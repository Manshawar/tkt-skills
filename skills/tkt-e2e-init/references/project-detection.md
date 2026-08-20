# Project Detection

从真实文件系统识别项目结构。每项给「查什么 → 怎么判断」,禁止猜。

## 1. Monorepo 信号

- 根目录**没有** `package.json`,但子目录各自有 → monorepo
- 根有 `pnpm-workspace.yaml` / `lerna.json` / `turbo.json` → monorepo
- 根有 `package.json` 但只有 `workspaces` 字段、无 dev script → monorepo

单仓单前端:根 `package.json` 有 `dev`/`serve` script,`src/` 在根下。

## 2. 多前端识别

候选子目录名:`web` `mobile` `app` `admin` `desktop` `h5` `miniapp`。判据:每个含 `package.json` + 独立 `dev` script + 独立端口。

每个前端 = 一个 Playwright project。测多个时 `projects: [{name, use.baseURL, testDir}]`。

## 3. 端口探测(不猜默认)

按优先级查:

1. CLI 参数:dev script 里的 `--port 5174`、`-p 8899`
2. `vite.config.ts`: `server: { port: N }`(函数式 `defineConfig(({command}) => ...)` 里也有)
3. `next.config.js`: `devServer` / 自定义 server
4. webpack `devServer.port`
5. 无显式配置时才用默认:vite 5173、webpack 8080、next 3000

注意:默认端口常被 `--port` 覆盖,以 CLI 参数为准。

### 端口-项目对应验证(必做,防测错项目)

读到的端口**必须验证其服务属于被测项目**,否则 `webServer.reuseExistingServer: true` 会复用别的项目,测试全跑在错误页面。

1. **确认端口监听归属**:`lsof -iTCP:<port> -sTCP:LISTEN` 看进程命令行是否指向被测项目目录。不是 → 端口被别的项目占用(如 toolkit 的 5173 被 zcode mobile 抢先,顺延出真实端口)。
2. **起 dev server 后复核**:被测 dev server 启动后,确认它实际监听的端口(端口被占时 vite 会自动 +1 顺延),用**实际监听口**做 `url`,不用读 config 的默认值。
3. **归属特征核对**:curl 该端口,看返回页面含被测项目独有文案/标题;或与项目源码的首页文案比对。特征对不上 → 端口上是别的服务。

**冲突处理**:端口被其他项目占时,让被测 dev server 顺延后取实际端口,或换一个空闲端口重启 dev server;`url` 永远写「被测项目实际监听的端口」。

## 4. 登录态识别

问:「这个页面不登录能直接看吗?」不能 → 必须注入登录态,否则首次跑就红。

查证线索:

- **路由拦截器**:`router-interceptor.ts`、`permission.ts`、`guards/`、`router.beforeEach` —— 未登录跳登录页
- **动态路由**:`role-router.ts`、按角色/权限生成的路由表 —— 目标页可能不在静态路由里。**失效模式**:守卫按 `to.name` 判白名单时,动态路由未注入 → `to.name` 为 undefined → 白名单不生效、落入认证分支跳认证失败页。检测点:①守卫是否用 `to.name` 判白名单 ②目标页是否在按角色动态生成的路由表 —— 二者同时成立 ⇒ 必须注入登录态
- **存储键**:pinia/vuex persist 的 key(常带 `appId` 或环境变量)、`localStorage`/`sessionStorage` 存的 token/user 字段。**坑**:`pinia-plugin-persist` 未指定 `storage` 时默认 **sessionStorage**,注入目标写成 localStorage 会静默无效

注入方式(写入 spec 的 `beforeEach` 或 `addInitScript`):

```ts
// persist 键写 sessionStorage(pinia-plugin-persist 默认 storage);独立 token 键按项目实际存哪
await page.addInitScript(() => {
  localStorage.setItem('<tokenKey>', '<fake-token>')
  sessionStorage.setItem('<persistKey>', JSON.stringify({ /* 项目需要的 state 结构 */ }))
})
```

关键:persist 的 key 和 state 结构必须和项目源码一致,否则注入无效。**具体项目的 key/结构值在项目本地 wiki,不在本 skill。**

## 5. 后端依赖识别

问:「页面数据从哪来?」:

- 纯前端 mock(`vite-plugin-mock`、`msw`)→ 无后端依赖,直接测
- 调真实 API → 找后端端口(go `server.py`、`main.go` 的监听口、`.env` 的 API base)

有后端依赖时,spec 用「探测端口 → 不可用则 skip」:

```ts
const ping = (port: number) => new Promise<boolean>((resolve) => {
  const s = net.connect({ port, host: '127.0.0.1', timeout: 1500 })
  s.once('connect', () => { s.destroy(); resolve(true) })
  s.once('timeout', () => { s.destroy(); resolve(false) })
  s.once('error', () => { s.destroy(); resolve(false) })
})
// beforeAll: if (!(await ping(3210))) test.skip()
```

把依赖后端的用例标为 P1(不依赖后端的基线冒烟标 P0),后端没起时 P1 自动跳过、P0 照常绿。
