# 企业主题色参照（通用）

适用：任何使用语义 token + `html.dark` 的企业前端（深色 + 语义别名）。不绑定具体业务仓库。

**何时读本文件**：视觉审查 / 改 CSS / 深色适配 / 截图里出现白底、反色字、按钮发灰时。先对照本表再改代码。

来源：主题 v8 令牌 + UI v8 色值表 + 深色适配设计方案 v3。

---

## 硬规则

1. 业务样式只写语义别名：`var(--bg-primary)`。禁止硬编码 `#hex` / `rgba()`，禁止组件里直接写 `--Lx-XXX`。
2. 浅/深色值由主题包注入（`:root` 浅色，`html.dark` 覆盖深色）。不要手写两套色，不要用 `filter: invert` 当主题。
3. **同色按 CSS 属性映射不同令牌**：`#fff` 作 `background` → `--bg-primary`；作 `color`（品牌底/深色底上的白字）→ `--white-10`。不可一刀切。
4. 单色图标优先 `lx-icon-*` + `color: var(--text-primary)`（或导航 `--nav-label-*`）。封面/品牌底上的返回用 `--fixed-white-10` 或 `--text-black`（见下），不要再切 PNG。
5. 弹层 teleport 到 `body`：`dark` class 必须挂在 `<html>`，不能只挂应用根节点。

命名已改（旧名勿用）：`--text-on-brand` → `--text-black`；`--overlay-*` → `--mask-*`。

---

## 场景 → 别名（修 UI 先查）

| 场景 | 别名 | Light | Dark |
|---|---|---|---|
| 卡片/容器白底、底栏、顶 Tab | `--bg-primary` | #FFFFFF | #1B1B1B |
| 页面灰底 | `--bg-secondary` | #F2F3F4 | #111111 |
| 浮起卡片 / 聊天气泡接收 | `--bg-tertiary` | #FFFFFF | #2D2D2D |
| 输入框、弱底、嵌套灰 | `--bg-quaternary` | #F8F8F9 | #363636 |
| 弹层背景 | `--bg-popout-primary` | #FFFFFF | #2D2D2D |
| 标题/主文字 | `--text-primary` | #000 87% | #FFF 87% |
| 描述/次文字 | `--text-secondary` | #242E3E 65% | #FFF 65% |
| 辅助文字 | `--text-tertiary` | 48% | #FFF 48% |
| 占位/禁用字 | `--text-quaternary` | 30% | #FFF 30% |
| 品牌底上「会随深浅互换」的字 | `--text-black` | Black_Label | Black_Label |
| 品牌蓝（字/图标/主按钮底） | `--brand` | #347AFC | #347AFC |
| 主按钮 hover / 按下 / 禁用底 | `--brand-hover` / `--brand-active` / `--brand-disabled` | Brand5 / 7 / 3 | 同左（禁用深色 #172954） |
| list/input 分割线 | `--divider-primary` | #242E3E 8% | #FFF 6% |
| 弹窗/底栏竖分割线 | `--divider-secondary` | 15% | #FFF 9% |
| 浅/深蒙层 | `--mask-primary` / `--mask-secondary` | 黑 40% / 60% | 黑 70% |
| 骨架条 | `--skeleton` | = `--bg-quaternary` | 跟随 |
| 危险 / 成功 / 警告 | `--danger` / `--success` / `--warning` | Red6 / Green6 / Yellow6 | 跟随包 |

导航：栏底 `--nav-bg-primary`，栏上文字图标 `--nav-label-primary`。封面图上的白图标用 `--fixed-white-10`（深浅都是纯白）。

---

## 按钮（色值表规定，不要猜）

主按钮（`type="info"` / `primary`）：

| 状态 | 背景 | 文字 |
|---|---|---|
| 正常 | `--brand`（Brand6） | `--white-10`（浅纯白 / 深白 87%） |
| 按下 | `--brand-active`（Brand7） | `--white-8` |
| 禁用 | `--brand-disabled`（Brand3） | `--white-12` |

次要按钮：底 `--gray-3`，字 `--brand`；按下底 `--gray-4`，字 `--brand-active`。

**禁止**：主按钮文字用 `--text-black` 或 `--text-primary`（深色会变成深字压在蓝底上）。

---

## 视觉审查时怎么用

1. 截图看到「白块 / 浅底深色页 / 蓝钮黑字」→ 对照上表，标出应对的别名，再去代码里找硬编码或错误 token。
2. Vision 给出的 hex 是估算：与表差一档（如 #1a1a1a vs #1B1B1B）视为同 token，不要为 1~2 档偏差改令牌。
3. 业务项目若有 `theme.scss`，以该文件别名为准；缺别名时按设计方案补映射，不要在组件里写 `--Lx-*`。
