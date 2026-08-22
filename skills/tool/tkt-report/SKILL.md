---
name: tkt-report
description: "日报工作流：用 `tkt report` 采集当日 git 素材，按画像与规则写正文，归档到 daily.jsonl。Use when user says '写日报', '日报', 'daily report', '归档日报', '今天干了啥', 'tkt report', or invokes /tkt-report. Triggers: report, daily, 日报, 写日报, 日报生成, 归档, 记录今天."
argument-hint: "[date|--date YYYY-MM-DD]"
metadata:
  scope: global
---

# tkt-report

IRON LAW: 采集**只走 `tkt report gather`**，禁止手写 git log 猜 commits；日报正文由你（agent）写，CLI 只负责采集与归档；**禁止编造**素材/画像里没有的模块名、PR、客户、路径；画像用户自己改文件，你**不自动改写**画像。

本 skill 引导 AI 完成「记录 + 写好日报」两个工作。tkt 只提供原子能力（gather / save / list / show），无 AI 生成、无 UI、无循环。

## 前置

- 已安装 `tkt`（`npm i @manshawar/tkt -g`）；在仓库根运行命令。
- 画像在 `~/.config/tkt/profile/`（`identity.md` + `scenarios/report.md`），用户直接编辑；`tkt report` 首次运行会自动写入底板，之后**用户自己改**，skill 不改画像。
- 名单/工时窗在 `~/.config/tkt/report/setting.json`，一般无需手动改；显式采集直接传路径即可。

## Workflow

```
tkt-report Progress:

- [ ] Step 1: 采集素材（tkt report gather）⚠️ REQUIRED
- [ ] Step 2: 读画像与规则
- [ ] Step 3: 写日报正文（items + sheetTime）
- [ ] Step 4: 归档（tkt report save）
- [ ] Step 5: 确认输出
```

## Step 1: 采集素材 ⚠️ REQUIRED

运行（默认今天；补昨天加 `--yesterday`，指定日 `--date YYYY-MM-DD`）：

```bash
tkt report gather
```

- 输出 JSON：`date` / `targetHours`（今日目标工时）/ `dayStart` / `dayEnd` / `profile`（画像块）/ `repos[]`（各仓 display_name、project、commits、hours）/ `sessionHours` / `commitCount`。
- 用户口头提到某仓库/路径，**显式传路径采集**（会写入名单并采当日 commits）：

```bash
tkt report gather /abs/path/to/repo
```

- 名单空报错时：要么传路径，要么提示用户编辑 `setting.json` 勾选仓库。
- `--json` 默认即 JSON，无需额外加。

## Step 2: 读画像与规则

- `profile` 字段已含画像块（Identity + Scenario），遵守它；与用户明示冲突时以用户为准。
- 若画像需要调整，**告知用户直接编辑** `~/.config/tkt/profile/` 下的 md 文件，你不代改。
- 写正文规则见 `references/daily-rules.md`，**必须遵守**（Iron Law、条数/工时/sheetTime 约束）。

## Step 3: 写日报正文

按 `daily-rules.md` 产出：

- `items[]`：`{ project, text, hours }`。project 用中文 display_name（gather 里 `repos[].project`），禁止英文仓库名；hours 0.5 粒度，单条 0.5–4；总和对齐 `targetHours`（不足也如实写，save 会提示）。
- `sheetTime`：单行 ≤80 字，无【】、无「小时」、无换行，用「；」连接概括。

## Step 4: 归档 ⚠️ REQUIRED

```bash
tkt report save --date YYYY-MM-DD --items '<json>' --sheet '<概括>'
```

- `save` 会校验（hours 归一、sheet 单行、text 非空）并写 `~/.config/tkt/report/daily.jsonl`（同日期覆盖）。
- 追加补充：先看历史 `tkt report show --date YYYY-MM-DD`，把既有 items 与新条目合并后重新 save（同日期覆盖）。
- 不复制到剪贴板加 `--no-clipboard`；只校验不归档加 `--dry-run`。

## Step 5: 确认输出

- 归档成功后 `tkt report show --date YYYY-MM-DD` 核对，或 `tkt report list` 看最近记录。
- 把 sheetTime + 分点正文交付给用户。

## 画像编辑指引（给用户）

画像即 `~/.config/tkt/profile/` 下 md 文件，每行一条偏好，直接改：

- `identity.md`：总身份（最多 12 行）
- `scenarios/report.md`：日报场景（最多 8 行），如「数据来源：从 git 收集」「目标工时对齐」

改完下次 `tkt report gather` 自动生效，无需确认。
