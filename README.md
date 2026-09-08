# tkt-skills

Claude Code / Cursor 的 skill 集合。skill 由 `SKILL.md` 定义一类任务的固定处理流程,模型在对应场景触发时加载执行。正本统一维护在 `skills/<name>/SKILL.md`,通过 `npx skills` 安装到本地。

## 这是什么

按用途分两类,完整列表见下:

- **开发类 `skills/dev/`** — AI 辅助开发的流程 skill:项目规则初始化(`AGENTS.md`)、开发路由、实现后走查、验收、e2e 用例沉淀
- **工具类 `skills/tool/`** — 本机环境与日常操作 skill:Claude Code / CCR / cc-switch 配置、Clash 分流、JIRA 填单、日报归档、登录态处理

> `scope: global` → 装进 `~/.claude/skills`,跨项目生效;`project` → 项目内按需初始化。本仓库**不依赖 tkt CLI**(仅 [tkt-report](skills/tool/tkt-report/SKILL.md) 配合 `tkt report`,见 [Manshawar/toolkit](https://github.com/Manshawar/toolkit)),只放公开内容。

## 最小工作流

新机器/新环境按下列顺序建立。其中有前置依赖的两步:**导入全局协作规则**与 **tkt-rules 项目初始化**。

1. **安装 skills**

   ```bash
   npx skills add Manshawar/tkt-skills -g
   ```

2. **导入全局协作规则**(Claude Code)
   全局规则正本为 `~/.claude/CLAUDE.md`;本仓库 `global/CLAUDE.md` 是与正本逐行一致的留档副本。新机器上建立全局规则:

   ```bash
   cp global/CLAUDE.md ~/.claude/CLAUDE.md
   ```

   同步到**其他 agent**(Cursor 等)不需要专用 skill —— 把下面这段提示词丢给对方 agent,让它读正本写入自己的规则文件:

   ```text
   请把 <正本路径>(本机 ~/.claude/CLAUDE.md,或本仓库 global/CLAUDE.md)的完整内容作为全局协作规则,写入你所在环境的全局指令文件,逐行一致、不增删改:
   - Claude Code:覆盖 ~/.claude/CLAUDE.md
   - Cursor:写入 ~/.cursor/rules/global.mdc,开头加 frontmatter(description: 全局协作规则 — 回复风格 + Session Receipt;alwaysApply: true)
   - 其他 agent:写入你读取全局指令的文件
   ```

3. **tkt-rules 项目初始化**
   在项目根目录打开 Claude,触发 `/tkt-rules`,按交互回答生成 `AGENTS.md` 与指向它的 `CLAUDE.md`(渐进式披露 WHAT/WHY/HOW)。

### 开发协作

规则与项目初始化之后,日常开发建议这样分工:

- **方案/需求探索**:推荐外部通用方法 skill —— `superpowers`(brainstorming 拆解需求)、`grilling`(grill 推敲方案)。安装:

  ```bash
  claude plugin install superpowers                 # obra/superpowers,官方 marketplace 已收录
  npx skills add mattpocock/skills -g --skill grilling   # mattpocock/skills
  ```

- **功能完成**:用 `tkt-walkthrough` 自动走查 —— 派子 agent + agent-browser 找问题出清单,修复后复走查闭环
- **防回归**:攒一批稳定功能后用 `tkt-test-gen`(或先 `tkt-e2e-init` 初始化)沉淀视觉回归 e2e 用例,上线前跑一遍

## Skill 列表

按用途分两类:`skills/dev/`(开发类)、`skills/tool/`(工具类)。

### 开发类 `skills/dev/`

| Skill | 说明 | 作用域 |
| --- | --- | --- |
| [tkt-guide](skills/dev/tkt-guide/SKILL.md) | AI 开发工作流路由导引 — 问用户当前在哪一步,输出下一步该跑的 skill/命令 | global |
| [tkt-rules](skills/dev/tkt-rules/SKILL.md) | 初始化/维护项目 `AGENTS.md` + `CLAUDE.md`,渐进式披露,WHAT/WHY/HOW | project |
| [tkt-socratic](skills/dev/tkt-socratic/SKILL.md) | 实现后苏格拉底式复查 — 用模板自问,产出 ≤5 条实质风险点 | global |
| [tkt-e2e-init](skills/dev/tkt-e2e-init/SKILL.md) | AI 视觉回归测试初始化 — Midscene + Playwright 隔离 e2e/ 子项目 | project |
| [tkt-test-gen](skills/dev/tkt-test-gen/SKILL.md) | 根据 git diff 生成视觉回归用例 — 半自动(草稿人确认后入库) | project |
| [tkt-walkthrough](skills/dev/tkt-walkthrough/SKILL.md) | 实现后自动回归走查 — 派子 agent + agent-browser 找问题出清单,主 agent 修复后复走查闭环 | global |

> 已停用:~~tkt-verify~~(截图人证日常验证)2026-09 归档至 `skills/_archive/tkt-verify/`,由 tkt-walkthrough 替代。

### 工具类 `skills/tool/`

| Skill | 说明 | 作用域 |
| --- | --- | --- |
| [tkt-cc-setup](skills/tool/tkt-cc-setup/SKILL.md) | Claude Code + cc-switch 本机排查/一键配置 — 底部 HUD、双 token、通用配置持久化 | global |
| [tkt-ccr-init](skills/tool/tkt-ccr-init/SKILL.md) | CCR 新电脑初始化 — launchd/3456、鉴权、proxy、主模型全名、cc-switch 同步 | global |
| [skills-cli](skills/tool/skills-cli/SKILL.md) | `npx skills` 命令速查与判断树 — 装/更新/查/移除前先判断该用哪个命令 | global |
| [clash-verge-rule](skills/tool/clash-verge-rule/SKILL.md) | 管理 Clash 白名单分流规则 — 加/删规则、配常用规则、清空/列出、内网 DNS | global |
| [tkt-jira-fix](skills/tool/tkt-jira-fix/SKILL.md) | 用 agent-browser 填 JIRA bug 处理日志（开始处理 + 已修复填表） | global |
| [tkt-cc-provider-switch](skills/tool/tkt-cc-provider-switch/SKILL.md) | cc-switch CLI 供应商动态切换 — 临时启某厂商独立终端（start，不污染全局）或持久切默认（switch） | global |
| [tkt-report](skills/tool/tkt-report/SKILL.md) | 日报工作流 — 采集当日 git 素材,按画像与规则写正文,归档 daily.jsonl | global |
| [local-login](skills/tool/local-login/SKILL.md) | agent-browser 登录处理 — 走官方登录 / eval 进受保护页,不造 token | global |

## 安装

全部安装:

```bash
npx skills add Manshawar/tkt-skills -g
```

装单个 skill 同理,指定 --skill:

```bash
npx skills add Manshawar/tkt-skills -g --skill tkt-guide
```

## 更新

每次改 skill 固定两步:**先改正本,再全局同步**。

1. 编辑本仓库 `skills/<name>/`,在 tkt-skills 提交并 push
2. 全局同步:`npx skills add Manshawar/tkt-skills -g`

> `npx skills update` 是批量跟随**所有**上游源的命令,不是本仓库的同步手段;本流程只用 `add` 精准推送本仓库改动。

## 新增 skill

在 `skills/<name>/SKILL.md` 新建,frontmatter 含 `name` / `description`(触发词)/ `metadata.scope`。新增后按上面两步发布。

## 目录结构

```
skills/dev/<name>/SKILL.md   # 开发类 skill 正本(入口)
skills/tool/<name>/SKILL.md  # 工具类 skill 正本(入口)
skills/<cat>/<name>/references/    # 长文档引用,避免 SKILL.md 膨胀
skills/<cat>/<name>/templates/     # 生成模板(如 AGENTS.md)
skills/<cat>/<name>/scripts/       # 配套脚本
```

## 开发工作区

```bash
code ~/utils/tkt.code-workspace   # 打开 tkt-skills 开发工作区
```
