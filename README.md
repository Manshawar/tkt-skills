# tkt-skills

公开 AI 协作 skill 的分发仓库。正本统一维护在 `skills/<name>/SKILL.md`,通过 `npx skills` 全局安装/更新。

## 这是什么

`tkt` 工具链(见 [Manshawar/toolkit](https://github.com/Manshawar/toolkit))配套的公开 skill 集合。本仓库**只放公开 skill**,含内网/公司敏感信息的私有 skill 留在 toolkit 仓库,不对外分发。

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
| [tkt-sso-test](skills/dev/tkt-sso-test/SKILL.md) | 线上部署页面测试初始化 — 后台 SSO 真实登录链,不 mock 客户端环境 | project |

### 工具类 `skills/tool/`

| Skill | 说明 | 作用域 |
| --- | --- | --- |
| [tkt-cc-setup](skills/tool/tkt-cc-setup/SKILL.md) | Claude Code + cc-switch 本机排查/一键配置 — 底部 HUD、双 token、通用配置持久化 | global |
| [tkt-ccr-init](skills/tool/tkt-ccr-init/SKILL.md) | CCR 新电脑初始化 — launchd/3456、鉴权、proxy、主模型全名、cc-switch 同步 | global |
| [skills-cli](skills/tool/skills-cli/SKILL.md) | `npx skills` 命令速查与判断树 — 装/更新/查/移除前先判断该用哪个命令 | global |
| [clash-verge-rule](skills/tool/clash-verge-rule/SKILL.md) | 管理 Clash 白名单分流规则 — 加/删规则、配常用规则、清空/列出、内网 DNS | global |
| [tkt-jira-fix](skills/tool/tkt-jira-fix/SKILL.md) | 用 agent-browser 填 JIRA bug 处理日志（开始处理 + 已修复填表） | global |
| [tkt-ccr-image-route](skills/tool/tkt-ccr-image-route/SKILL.md) | CCR 含图转发 — 主供应商无多模态时 Read 请求 rewrite 到另一 Provider/model | global |
| [tkt-vision-agent](skills/tool/tkt-vision-agent/SKILL.md) | vision-analyst 子 agent + CLAUDE.md 视觉分工（与 CCR 解耦） | global |

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

## 与 toolkit 的分工

| 仓库 | 内容 | 安装 |
| --- | --- | --- |
| 本仓库 tkt-skills | 公开 skill(tkt-guide / tkt-rules / tkt-socratic / tkt-e2e-init / tkt-sso-test / tkt-test-gen / visual-debug / skills-cli / tkt-cc-setup / clash-verge-rule) | `npx skills add Manshawar/tkt-skills -g` |
| toolkit | 私有 skill(不再放公开类 skill) | 按需 `npx skills add Manshawar/toolkit -g`(私有授权) |

## 开发工作区

```bash
code ~/utils/tkt.code-workspace   # toolkit + tkt-skills 双根
```
