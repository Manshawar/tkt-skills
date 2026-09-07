---
name: local-login
description: "agent-browser 自动化遇到登录/鉴权问题的通用处理:识别目标环境登录方式、走官方登录、eval 导航进受保护页。当 agent-browser 出现未登录、被重定向、401/403、staffId/token 失效、进不了受保护页、open 导航跳走、需要账号登录才能继续探测时,先调用本 skill 处理登录态再继续。已知环境:zcode(8899)用 testlogin.html 选账号一键登录。当用户说'登录 zcode'、'本地登录'、'用 testlogin 登录'、'打开表单设计页'、'跳转 form-home'、'进低代码平台'、'测试账号登录'、'认证失败进不去'、'帮我登录' 时也使用。Actions: login, log in, 登录, 跳转, 导航, navigate to form, open designer, 进表单页, 切账号, 重新登录, re-auth, 鉴权失败, 免密登录。Objects: testlogin, staffId, form-home, form-create, 表单设计器, AiAssistant, AI 助手, 8899, 8080 跳转, 认证失败, 未登录, 测试账号, 登录页, SSO, CAS。凭据: JIRA 密码在 ~/.tkt/jira.json(不要外泄)。"
metadata:
  scope: global
---

# Local Login(agent-browser 登录处理)

agent-browser 自动化遇到登录/鉴权问题的通用处理流程。核心思路:识别目标环境登录方式 → 走官方登录(测试登录页/真实账号) → eval 导航进受保护页 → 验证登录态。**不手动造 token、不硬编码登录态**,一律走应用官方登录。

IRON LAW: **NEVER 手动造 token / localStorage 注入登录态** — 应用启动时 persist(如 pinia)会覆写,必失败。一律走官方登录(testlogin / 真实账号 / SSO 等),存登录凭证后应用自动换 token。

## Workflow

```
Local Login Progress:

- [ ] Step 1: 识别目标环境与登录方式 ⚠️ REQUIRED
  - [ ] 1.1 确认目标应用/环境是什么(localhost:PORT? 域名?);找到登录方式:测试登录页(如 /testlogin.html)/ 真实账号登录页 / SSO-CAS
  - [ ] 1.2 确认对应 dev server / 后端在跑(若目标环境依赖)
  - [ ] 1.3 查本 skill「已知环境」表:是否有该环境的测试登录入口
- [ ] Step 2: 走官方登录 ⚠️ REQUIRED
  - [ ] 2.1 测试登录页 → agent-browser open 登录页,snapshot 选账号,click 登录
  - [ ] 2.2 真实账号 → 在登录页 fill 账号密码(凭据在 ~/.tkt/,勿外泄)
  - [ ] 2.3 登录后确认跳转到已登录主页(/home 之类),URL 停在目标端口
- [ ] Step 3: 导航到目标页 ⛔ BLOCKING
  - [ ] 3.1 用 eval window.location.href= 导航,**不要用 open**(SPA 应用 open 会触发完整加载 → router guard 重定向到别的端口/应用)
  - [ ] 3.2 确认 URL 停在目标端口、目标组件在
- [ ] Step 4: 交互验证 ⚠️ REQUIRED
  - [ ] 4.1 eval 确认目标 DOM 存在(如 .ai-fab、特定组件容器)
  - [ ] 4.2 需要时点击/输入,截图人证
```

## Step 1: 识别目标环境与登录方式

问自己:目标应用跑在哪?它靠什么登录?

```bash
lsof -nP -iTCP:<PORT> -sTCP:LISTEN   # 目标应用 dev server
```

- 有测试登录页(/testlogin.html 之类,内嵌账号列表)→ **优先用**,免密一键登录
- 无测试登录页 → 真实账号登录:找登录页,fill 账号密码(凭据文件 `~/.tkt/` 下,勿外泄)
- SSO/CAS 单点登录 → 走 SSO 登录流程,登录后回跳目标应用

**已知环境**(有测试登录入口的应用,追加时在此登记):

| 应用 | 端口 | 登录方式 | 测试登录入口 |
|---|---|---|---|
| zcode 低代码平台 | 8899 | testlogin.html 选账号 | http://localhost:8899/testlogin.html |

## Step 2: 走官方登录

**测试登录页**示例(zcode):

```bash
agent-browser open http://localhost:8899/testlogin.html
agent-browser snapshot -i -c     # 账号列表按组织分节
```

- 同名账号多次出现 → **选 orgId 前缀与目标 appId 匹配的那个**(如 appId 95073664... → 生态测试组织 2621440)
- 不确定选第一个,登录后看 staffId 前缀
- 点击账号 → 存登录凭证(localStorage.staffId)→ 跳 `/` → 应用自动换 token

**真实账号**:登录页 fill 用户名/密码,提交,等跳转。

## Step 3: 导航到目标页 ⛔ BLOCKING

**SPA 应用必须用 eval 导航,禁止 open**:

```bash
agent-browser eval 'window.location.href="<目标URL>"'
```

原因:open 触发完整页面加载 → router guard 按角色重定向(如 zcode 跳 localhost:8080 权限管理应用)。eval 是 SPA 内导航,不重新加载,停在目标端口。

示例(zcode 表单设计):
```bash
agent-browser eval 'window.location.href="http://localhost:8899/#/form-home?type=NormalForm&appId=<id>&appName=<name>"'
```

## Step 4: 交互验证

```bash
agent-browser eval 'JSON.stringify({url:location.href, ok:!!document.querySelector(".目标选择器")})'
```

- `ok=true` → 登录成功,目标在
- 跳其他端口/应用 → 用了 open 导航,回 Step 3 用 eval 重导航
- 认证失败 / 被登出 → 回 Step 2 重新登录(凭证可能失效)

## Anti-Patterns

- **不手动造 token / localStorage**:应用 persist 会覆写,必失败。只走官方登录(testlogin/真实账号/SSO)。
- **不用 open 导航到受保护页**:SPA 会重定向跳走。用 eval。
- **不猜账号 ID**:测试登录页上有名字,从 snapshot 选,不手敲。
- **不在页面里 eval 设 input.value 用 setter 直调**:`Illegal invocation`。用 agent-browser fill 或绑定 setter 到 prototype。
- **不重复撞登录**:一次登录态会话有效,后续交互用 eval 导航保持。
- **不把真实密码写进日志/聊天**:凭据在 ~/.tkt/,用完即忘,不打印明文。

## Pre-Delivery Checklist

- [ ] 目标应用/端口确认在跑
- [ ] 走官方登录(测试登录页或真实账号),非手动注入
- [ ] 登录后 URL 停在目标端口(未跳走)
- [ ] 目标 DOM 确认存在
- [ ] 截图留证(如有交互)
