# PROJECT — tkt-skills 项目理解

> 本文档为「重新设计首页」提供设计输入:定位、用户、叙事、语气、每个 skill 的设计画像。
> 同时作为独立交付物,供后续维护者与设计者阅读。
> 数据来源:`README.md`、`global/CLAUDE.md`、`skills/**/SKILL.md`、git 历史(截至 2026-08-22)。

---

## 1. 项目是什么

**一句话**:tkt-skills 是「如何像高手一样操作 Claude Code(CC)」的公开 skill 合集——把 Manshawar 在真实 AI 协作开发中踩过的坑、形成的纪律,沉淀成可直接安装、可被 AI 触发的操作手册。

**本质**:不是文档站,不是教程站,是一个 **可执行的操作系统**。每个 skill 都是一段「告诉 AI 该怎么做」的指令集,由 `npx skills` 分发安装,装完即进入用户的 AI 工作流,在用户说对触发词时自动生效。

**定位升级(README 原话)**:
> We're building a curated collection of skills to operate Claude Code (CC) like a pro. Every skill in this collection is grounded in practical usage, intended to be practical, task-oriented, and battle-tested.

关键词:**curated(精选非堆砌)** · **grounded in practical usage(实战沉淀)** · **battle-tested(打过硬仗)**。

**与其他仓库的分工**:
- `tkt-skills`(本仓库):只放**公开** skill,无敏感信息,对外分发。
- `toolkit`(私有仓库):含内网/公司敏感信息的私有 skill,按私有授权安装。

---

## 2. 为谁而建

| 维度 | 画像 |
| --- | --- |
| 身份 | 深度 Claude Code 用户、开发者,拥有自己的 AI 协作工作流 |
| 能力 | 懂命令行、懂 git、懂 CI;能接受 `npx skills add Manshawar/tkt-skills -g` 这种安装方式 |
| 场景 | 单人 + AI 协作开发;跨本地工具链(Clash 代理、cc-switch 供应商切换、公司内网 SSO) |
| 诉求 | 少走弯路:AI 有纪律、测试有体系、配置一次到位、钱(API 费用)算得明白 |
| 语言 | 中文为主;命令/代码/IRON LAW 用英文——这是「命令优先、说明为辅」的混合语态 |

**生态上下文(影响视觉隐喻)**:
- DeepSeek / 火山引擎 Coding Plan / GLM——中国模型生态,强调**按量计费、省钱、人民币口径**。
- Clash 白名单分流——网络工具,「白名单 = 只有列出的走代理,其余直连」。
- cc-switch + claude-hud——本机 Claude Code 配置,底部状态栏、双 token、供应商切换。
- 公司内网(蓝信/qianxin-inc.cn 域名 / 企业 IM WebView / SSO 登录链)。

---

## 3. 核心叙事(首页要讲的故事)

三层,由表及里:

1. **表面**:一套 Claude Code 技能包,装了就能用。
2. **中层**:不只是「更多 skill」,而是一套**有纪律的开发工作流**——路由(做什么)、规则(怎么写)、测试(怎么验)、配置(环境怎么配)、复盘(收尾怎么把好关)。
3. **内核**:每个 skill 都是一条**从真实事故里长出来的 IRON LAW**(不可违反的铁律)。"Battle-tested"不是营销词——`Both ANTHROPIC_AUTH_TOKEN and ANTHROPIC_API_KEY set`、`DOMAIN-KEYWORD` 带 `https://`、端口被别的项目占用测错页面……这些坑都被写进了禁止清单。

**叙事钩子**:从 git 历史看演进脉络——
1. 起步:工作流路由(tkt-guide) + 项目规则(tkt-rules)
2. 闭环:验证(tkt-verify → 并入 tkt-guide) + 验收复盘(tkt-socratic)
3. 扩展:视觉回归测试(tkt-e2e-init / tkt-test-gen)、线上 SSO 测试(tkt-sso-test)
4. 外延:本机工具链(tkt-cc-setup / skills-cli / clash-verge-rule)

演进方向 = 「把 AI 协作开发从'能跑'推向'有质量保障、成本可控、可验收'」。

---

## 4. 产品结构

**两类**:`skills/dev/`(开发工作流)、`skills/tool/`(本机工具链)。

### 4.1 开发类 `skills/dev/`(6 个)

| Skill | 作用域 | 一句话本质 | 触发场景 |
| --- | --- | --- | --- |
| tkt-guide | global | **路由导引**:问用户在哪一步,输出下一步该跑的命令 | "what's next"、"方案探讨"、"验证" |
| tkt-rules | project | **项目规则初始化**:生成 AGENTS.md + CLAUDE.md,渐进式披露 | "initialize project rules" |
| tkt-socratic | global | **验收复盘**:苏格拉底式自问,产出 ≤5 条实质风险点(0 条也合法) | "验收"、"把关"、"风险复盘" |
| tkt-e2e-init | project | **视觉回归测试初始化**:Midscene + Playwright,隔离 e2e/ 子项目 | "初始化 e2e"、"配 Midscene" |
| tkt-test-gen | project | **生成视觉回归用例**:像用户一样操作,防回归,半自动入库 | "功能做完了写个测试" |
| tkt-sso-test | project | **线上 SSO 真实登录测试**:不 mock 客户端运行时 | "线上测试"、"真实登录测试" |

### 4.2 工具类 `skills/tool/`(4 个)

| Skill | 作用域 | 一句话本质 | 触发场景 |
| --- | --- | --- | --- |
| tkt-cc-setup | global | **CC + cc-switch 本机配置排查修复**:HUD、双 token、人民币计费 | "切换供应商后底部没了"、"配 HUD" |
| skills-cli | global | **npx skills 命令判断树**:动手前先判断该用哪个命令 | "装 skill"、"同步 skill" |
| clash-verge-rule | global | **Clash 白名单分流规则管理**:加/删规则、内网 DNS | "把 xxx 加到代理"、"配常用规则" |

---

## 5. 每个 skill 的设计画像(首页卡片直接输入)

给每个 skill 提炼:**心智隐喻 + 一句话文案 + 语气色彩**。供首页卡片、图标(本地 ComfyUI 文生图占位)、文案使用。

| Skill | 心智隐喻 | 首页文案方向 | 语气色彩 |
| --- | --- | --- | --- |
| tkt-guide | **导航/罗盘**:不知道下一步?问它 | "你现在在哪一步,下一步跑什么" | 温和指引 |
| tkt-rules | **地基/脚手架**:项目规则的骨架 | "一份 <300 行的 AGENTS.md,只写 AI 猜不出来的" | 规整、克制 |
| tkt-socratic | **把关人/闸门**:三道闸,宁缺毋滥 | "≤5 条实质风险点,0 条也合法" | 审慎、不啰嗦 |
| tkt-e2e-init | **探测仪**:先看现实再搭脚手架 | "先探测项目,再生成隔离的 e2e/" | 严谨、防呆 |
| tkt-test-gen | **白盒/录屏**:像用户一样操作留证 | "像用户一样操作,验证可见结果,生成可审阅报告" | 务实 |
| tkt-sso-test | **真实登录链/黑盒**:绝不 mock | "线上真实 SSO 登录,只读不写" | 铁律感 |
| tkt-cc-setup | **修理工/对账**:doctor 先行,一键 apply | "排查 + 一键配置,人民币计费算得清" | 实用、救火 |
| skills-cli | **命令字典/判断树**:动手前先判断 | "装/更新/查/移除前,先判断该用哪个命令" | 简洁、查表 |
| clash-verge-rule | **白名单/守卫**:绝不动兜底 MATCH,DIRECT | "白名单模式,只有列出的走代理,其余直连" | 规则感、防火墙气质 |

**图标隐喻占位文本**(给 ComfyUI 文生图的 prompt 方向,每个 skill 一个核心视觉元素):
- tkt-guide:罗盘 / 分岔路口 / 指南针
- tkt-rules:地基 / 脚手架 / 规整的文档页
- tkt-socratic:闸门 / 三道闸门 / 天平
- tkt-e2e-init:探照灯 / 探测雷达 / 测距仪
- tkt-test-gen:录制按钮 / 白盒 / 放大镜
- tkt-sso-test:锁 + 登录链 / 钥匙链 / 浏览器窗口
- tkt-cc-setup:扳手 + 美元改人民币符号 / 仪表盘底部状态栏
- skills-cli:命令提示符 `$` / 字典 / 判断树
- clash-verge-rule:盾牌 / 白名单清单 / 分流漏斗

---

## 6. 设计语气与风格约束(设计者必须遵守)

来自 `global/CLAUDE.md` 的全局协作规则,直接约束首页文案与排版:

### 语气
- **短句优先,砍客套**——首页文案不写废话,不说 "Welcome to",开场即价值。
- **结论 + 依据 + 下一步**——每个 skill 卡片文案:它做什么(结论)→ 凭什么(一句依据)→ 用户下一步(触发词/命令)。
- **命令逐字保留**——`npx skills add Manshawar/tkt-skills -g` 这类命令必须原样呈现,允许复制。
- **置信词文化**——项目内部用「可能/未验证」表态;首页承诺不要过度,避免营销腔。
- **正常句式仅限安全/不可逆/多步时序场景**——首页无此场景,全站保持"命令优先"的直给语感。

### 视觉关键词(从 skill 文体提炼)
- **IRON LAW**——不可违反的铁律,是最高层级的视觉强调元素(可做暗红/警戒色)。
- **Progress Checklist**——`- [ ]` 执行清单,天然的视觉节奏元素。
- **Pre-Delivery Checklist**——交付前自检。
- **Anti-Patterns**——「不要 X」清单,反面教材列表。
- **⚠️ REQUIRED**——必须步骤的强调标记。
- 中文 + 英文命令混排:正文中文,命令/术语英文——排版上要保留这种"代码感"。

### 结构语感
- 每个 skill = 一句话本质 + IRON LAW + 触发词,信息密度高,喜用**表格**压缩信息。
- 首页信息架构建议遵循同构:精简、分级、宁可少而准(呼应 tkt-socratic 的"宁缺毋滥,0 条也合法")。

---

## 7. 首页设计输入摘要

给设计者(impeccable 流程)的直接结论:

1. **模式**:Persuade(着陆页)——让访客**决定安装并信任**这套 skill。但受众是开发者,所以是"对开发者说话的 Persuade":克制、可验证、命令即证据。
2. **叙事主线**:精选 → 实战沉淀 → 有纪律的工作流。不要用"AI 技能集合"这种品类话术,用"10 条铁律级 skill,来自真实事故"。
3. **分类**:dev(开发工作流) / tool(工具链)双栏或分区的卡片布局。
4. **视觉隐喻方向**:
   - 主视觉:齿轮/仪表盘(工作流) + 盾牌/闸门(铁律) + 终端(命令)。
   - 颜色:终端深色底(呼应开发者)、警戒红(IRON LAW)、中性灰(克制)、少量强调色。
   - 拒绝"五彩斑斓的 AI 紫"——项目气质是纪律、精确、不花哨。
5. **文案红线**:
   - 不夸大(无营销腔,遵守置信词文化)。
   - 命令必须逐字正确(首页可放安装命令 + 复制按钮)。
   - 中文为主,命令/术语保留英文。
6. **CTA**:`npx skills add Manshawar/tkt-skills -g`(全部安装)——主行动按钮;单 skill 安装为次级路径。

---

## 8. 风险与开放问题(设计时需确认)

- 首页是否展示 git 演进脉络(从路由 → 测试 → 工具链)?适合做"时间线/脉络"区,但可能不是着陆页重点。
- 是否展示 IRON LAW 精选(如"只改 settings.json = 白改"、"绝不动 MATCH,DIRECT")?这些是极具辨识度的文案资产,建议至少展示 2-3 条作为信任锚点。
- 首页语言:全中文 or 中英混排?项目内容本身中英混合,首页建议中文主导 + 英文命令,保持一致性。

---

*本文件由 tkt-skills 项目理解产出,供首页重新设计使用;与 `README.md`(分发/安装说明)互补,不重复。*
