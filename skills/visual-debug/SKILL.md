---
name: visual-debug
description: "ONLY for non-multimodal / text-only main models that cannot see images (DeepSeek deepseek-*, GLM glm-* / ChatGLM / Zhipu). Do NOT use if the current model is multimodal (Claude, GPT-4o, Gemini, Grok, Kimi vision) or can already see the attached image — look at pixels directly, do not call tkt vision. Text-only: UI reconstruction via `tkt vision inspect` then edit project code; UI debug via `tkt vision compare`. Repair loop: inspect/compare → modify code → screenshot → compare --from. Also enterprise-IM web themes with semantic tokens (`html.dark` + `var(--bg-*)` / `var(--brand)`)."
metadata:
  scope: global
---

# Visual Debug

⛔ **主模型已能看图 → 立刻停用本 skill，禁止 `tkt vision`。** 直接看附件像素。本 skill 只给纯文本模型当视觉侧车。

即使主模型能看图：也禁止生成一份平行 HTML 再搬进项目。必须在现有代码上改。

Vision 是 Eyes。主模型是 Brain + Hands。Vision 只提供证据和建议方向，不写业务代码。

IRON LAW: 有图才下视觉结论。复刻 = inspect 目标图 → 改项目代码 → 截图 → compare。禁止让 Vision 出 HTML/Vue/React。禁止从截图裁图标。禁止无 JSON stdout 时 `json.load`。

- 有截图 → 基于截图分析，不靠代码猜视觉结果
- 没有截图 → 推测前加「假设：」，不用「确认/确实」
- 分清 Observation（图上可见）和 Hypothesis（可能原因）
- 无法确认 → `uncertain`，不编造
- suggestion 是调整方向，不是补丁。读项目后再最小修改

## 选轨道 ⚠️ REQUIRED

先自检：当前模型能否看见用户附的图？能 → 退出本 skill。

- 从截图/设计稿把**当前项目**还原到接近目标 → Track B
- 修现有 UI（视觉或交互）→ Track A
- 只要 OCR / 报错图 / 随口问图 → 直接对应命令，不走闭环

maxIterations = 5。循环状态机在本 skill，不在 tkt 内部改代码。

### Track B — 复刻（Repair Loop）

- [ ] 第 1 轮：`tkt vision inspect <目标图> --session .tkt-vision`（完整报告）。**不要**对着报告手写整页平行 HTML
- [ ] 读项目：定位真实 DOM / CSS / 组件；判断报告是否与代码一致；选最小改动
- [ ] 用项目已有 Playwright / 截图脚本拍当前页（没有就提示用户，不在 tkt 里新建浏览器基建）
- [ ] 第 2 轮起：`tkt vision compare <当前截图> --target <目标图> --from <上一轮 stdout 或 session/iter-N.json> --session .tkt-vision`
- [ ] 后续只根据未解决 / 新增 high·critical 改；已解决的不要再改回去
- [ ] 停止（任一即停）：
  - 无 high / critical
  - 连续两轮 issues 无改善（id/severity 几乎不变）
  - 达到 5 轮
  - 继续改会破坏业务或等于重写整页 → 停并说明风险
- [ ] 停时原样输出：`Visual verification did not converge after N iterations.`（若未达目标）

### Track A — 修 bug

先分类，再动手。不要把交互故障当成 CSS 问题修。

| 类型 | 怎么判断 | 怎么处理 |
| --- | --- | --- |
| 视觉 | 错位、溢出、遮挡、色差、字号、缺元素 | 有目标图 → `compare`；只有当前图 → `inspect`。只改 CSS/布局 |
| 交互 | 点了没反应、错页、hover 无反馈、表单失败 | 截图只证明「现在看起来怎样」；主模型查 JS / handler / state / 路由 |
| 无截图的交互描述 | 用户只口述 | **不调 vision**，直接查代码 |

- [ ] 视觉：未跑 inspect/compare 前不改 CSS
- [ ] 交互且有截图：最多 1 次 inspect 锁定界面状态。之后改代码，不要只改 CSS 假装修好
- [ ] Observe：只定位问题与严重度，不改代码
- [ ] Diagnose + Modify：视觉只动 confirmed/high；结构/位置 ≥ high，尺寸/间距 ≥ medium，字体/颜色/阴影 ≤ low。交互以代码为准
- [ ] Verify：视觉再截图 `compare --from`（同一张图不分析第二次）。交互优先复现/看 console
- [ ] 停止条件同 Track B（max 5）

## 前置

```bash
npm i @manshawar/tkt -g
tkt vision config    # 交互配多模态；非 TTY 让用户本机跑，或 `tkt vision ui`
tkt vision skill     # 装到 ~/.claude/skills/visual-debug/
```

- `tkt` 不在 PATH → 提示安装，不猜视觉结果
- 报未配置 → `tkt vision config` 或 `tkt vision ui`；不要自己重试交互配置
- 图片不存在 / 非 png·jpg·jpeg·webp → 直接报告，不调用
- 调用失败 → 返回实际错误，不编造结论

## 命令

```bash
tkt vision inspect <绝对路径> [-p "<关注>"] [--from <上轮.json>] [--session .tkt-vision]
tkt vision compare <当前图> --target <目标图> [-p "<关注>"] [--from <上轮.json>] [--session .tkt-vision]
tkt vision analyze <绝对路径> -p "<问题>" -m <mode> --json
```

inspect / compare：**stdout 始终是 JSON 报告**（含 `type`）。只解析 stdout。`--from` 把上一轮未解决 issues 压成短列表，不要把整份旧报告再贴进 `-p`。

| 命令 / mode | 何时 |
| --- | --- |
| `inspect` | Track B 第 1 轮；Track A 无对比图 |
| `compare` | 有当前 + 目标。后续轮必须 `--from` |
| `ui`（analyze -m） | 旧入口，等同 inspect 报告 |
| `debug` | 终端/日志/stack 截图 |
| `ocr` | 只提文字；`-p` 忽略 |
| `general` | 自由问图 |

status 只信 `confirmed` / `probable` / `uncertain` / `pass`。失败时读 `parse_error`/`error`，不要自己重试。完整 schema 仅解析失败或写消费代码时再读 [references/cli-contract.md](references/cli-contract.md)。

无截图：先查项目已有 Playwright / 截图脚本 / dev server。Playwright 空白页先查 JS 报错、未加载、请求失败、路由，不要先当 CSS 问题。

### 可选（非复刻主路径）

```bash
tkt vision analyze <图> -m tree --json --out <缓存>
tkt vision slots <tree.json> --dir ./assets/vision
tkt vision assert --tree <tree.json> --dom <dump.json>
```

仅当要对齐栏宽、需要粗测绘时用。不要对着 tree 手写整页。

## 禁止

- 主模型能看见附件图片时调用 `tkt vision` 或继续本 skill（看像素即可，仍须改项目代码，禁止平行 HTML）
- 让 Vision 生成 HTML / Vue / React / 整页 CSS
- 为视觉效果重写整页、换组件库、换技术栈
- 盲信 suggestion 直接落补丁，不读项目代码
- 从页面截图裁 logo/图标当素材
- 交互 bug 只改 CSS、不查事件绑定
- 把 stderr、`| tail` 当 JSON
- 没截图却说「确认是 margin」
- 为 1~2px 或 hex 偏一档再调 vision
- 普通编码任务调 Vision，除非问题表现为视觉问题

## 成本 / Token

- Track B 第 1 轮：1 次 inspect（完整报告）
- 之后每轮：1 次 compare + `--from`（只含未解决 / 新增）
- Track A 视觉：要证据 1 次；要验证再 compare；最多 5 次
- Track A 交互：0～1 次 inspect 看状态，其余查代码
- 不重复分析同一张图；代码无视觉改动时不要再分析

## 企业主题（按需）

出现 `html.dark`、`var(--bg-primary)` / `var(--brand)` 语义 token，或用户在改深色/色值时：

1. **先读** [references/theme-reference.md](references/theme-reference.md)，再改 CSS
2. 只用语义别名；禁止硬编码色；禁止组件里写 `--Lx-*`
3. 主按钮文字是 `--white-10`，不是 `--text-black`
4. 单色图标用 `lx-icon-*` + `color`，不要 `filter: invert` 切图

非该主题项目不要加载该参照。
