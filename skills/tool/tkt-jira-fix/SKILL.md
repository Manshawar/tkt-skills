---
name: tkt-jira-fix
description: "用 agent-browser 填 JIRA bug 处理日志（开始处理 + 已修复填表）。当用户说'填bug日志'、'处理这个bug'、'帮我填JIRA'、'标记已修复'、'提交bug解决'、'更新JIRA bug'、'把这个bug处理一下'时使用。处理 JIRA 工作流动作：开始处理、已修复、解决结果、历史BUG、问题分类、Bug出现原因、修复方法、影响范围、修复版本。触发对象：bug key（LXAPP-17278 之类）、JIRA 详情 URL、'这次的修复版本是X'。依赖 agent-browser 浏览器自动化。"
---

# Tkt Jira Fix

IRON LAW: **填表前必须确认 bug 标题与本次代码改动对应，修复描述与代码实际改动一致。** 最可能犯的错是填错 bug、或凭印象编造修复描述。任何一个必填项拿不准 → 停下问用户，不猜。

## 配置（私密信息不入库）

JIRA 地址等私密配置从用户根目录 `~/.tkt/jira.json` 读（skill 内不硬编码内网 URL）。首次使用前确认该文件存在：

```json
{ "jiraBase": "https://jira.qianxin-inc.cn", "authProfile": "wiki-qianxin", "defaultFixVersion": "车辆调度" }
```

- `jiraBase`：JIRA 根地址（本文档下文用 `<JIRA_BASE>` 占位）
- `authProfile`：agent-browser auth vault 里可复用的登录 profile
- `defaultFixVersion`：默认修复版本名（用户说「这次的修复版本是X」时优先用它）

## Workflow

```
Tkt Jira Fix Progress:

- [ ] Step 1: 确认 bug 与改动 ⚠️ REQUIRED
  - [ ] 1.1 拿 bug key（用户给 JIRA URL 或 LXAPP-xxx）
  - [ ] 1.2 打开 JIRA 详情，读标题+描述，判断是否本次改的问题
  - [ ] 1.3 从本次代码改动推导修复描述（原因/方法/影响范围），给用户确认
- [ ] Step 2: 登录 JIRA ⛔ BLOCKING（无 session 时）
- [ ] Step 3: 开始处理（仅状态 New 时）
- [ ] Step 4: 已修复填表 ⚠️ REQUIRED
  - [ ] 4.1 三个下拉：解决结果/历史BUG/问题分类
  - [ ] 4.2 三个文本：Bug出现原因/修复方法/影响范围
  - [ ] 4.3 修复版本：输入版本名选建议
- [ ] Step 5: 提交 + 验证状态变「已解决」
```

## Step 1: 确认 bug 与改动 ⚠️ REQUIRED

- 用户给了什么？URL 或 bug key（如 `LXAPP-17278`）。没有就用最近改的 bug。
- 打开 `<JIRA_BASE>/browse/<KEY>` 读标题。标题跟本次修复对不上吗？停，问用户。
- 修复描述从哪来？`git diff` / 本次 commit。问：这个 bug 的**Bug出现原因**、**修复方法**、**影响范围**分别写什么？用户没给就基于 diff 推导，然后**给用户过目**（Step 2 一起确认）。

## Step 2: 登录 JIRA ⛔ BLOCKING

打开页面跳到 `login.jsp`（无 session）时：

```bash
agent-browser auth login <authProfile> --url "<JIRA_BASE>/login.jsp"
```

然后确认跳转成功（URL 离开 login.jsp）。若 auth profile 不存在，找用户要 JIRA 账号密码。

## Step 3: 开始处理（仅状态 New）

详情页状态徽章（`.jira-issue-status-lozenge`）为 `New` 时：
1. 点「开始处理」
2. 弹窗备注框 `#comment` 填处理说明（如「已定位并修复：<一句话>」）
3. 点弹窗内「开始处理」按钮 → 状态变「已分配」

状态已是「已分配」→ 跳过本步。

## Step 4: 已修复填表 ⚠️ REQUIRED

点详情页「已修复」动作（内联表单出现）。加载 `references/jira-form.md` 拿字段 id 与 JS 操作技术要点。

**三个下拉**（JS 设 select.value + dispatch change，不要点 option）：
- `resolution` 解决结果 → `FIXED`
- `customfield_14900` 是否历史BUG → `否`
- `customfield_13933` 问题分类 → `正常编码缺陷`（若 bug 属其他类别，从选项里选最贴切的）

**三个文本**（`agent-browser fill`）：
- Bug出现原因：bug 为何发生（根因，一句话讲清）
- 修复方法：具体改了哪里、怎么改
- 影响范围：哪些页面/操作受影响

**修复版本**：`#fixVersions-textarea` 输入版本名（用户说「这次的修复版本是X」）→ 等 `#fixVersions-suggestions` 出现建议 → 点对应 li。

## Step 5: 提交 + 验证

- 点表单底部「已修复」按钮
- 若报 `.aui-message-error`（如「问题分类 is required」）→ 补填对应字段，重提
- 状态徽章变「已解决」= 成功。汇报 bug key + 状态。

## Anti-Patterns

- **点 JIRA 下拉的 option**：CDP 报 `DOM.getBoxModel` 错误。一律用 JS 设 select 值。
- **凭印象编修复描述**：每项必填字段都从 diff/commit 落地，用户没确认就停。
- **跳步**：状态 New 不「开始处理」直接「已修复」、或跳过多必填项——JIRA 会拦截，按错误信息补。
- **改已提交的表单内容**：提交后不要回填，用户要改让他说。
- **把 JIRA 密码写进 skill 或日志**：只复用 auth vault，不落明文。

## Pre-Delivery Checklist

- [ ] bug key 与本次改动匹配（标题核对过）
- [ ] 三个文本字段内容与 git diff 一致，用户已确认
- [ ] 下拉值正确（resolution=FIXED / 历史BUG=否 / 问题分类已选）
- [ ] 修复版本已选（select#fixVersions 选中项非空）
- [ ] 状态徽章 = 「已解决」，无 `.aui-message-error`
