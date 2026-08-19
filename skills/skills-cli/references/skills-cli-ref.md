# npx skills CLI 参考手册

版本:skills@1.5.23。命令:`npx skills <command>`(alias: `npx skills a/upgrade/ls`)。

## 安装

### `skills add <package>` — 装 skill 包(核心命令)

```bash
# 参数
npx skills add <repo-or-url>                # GitHub 仓库或 URL
  -g, --global                              # 全局安装(用户级),默认是项目级
  -a, --agent <agents>                      # 指定 agent(用 '*' 全部)
  -s, --skill <skills>                      # 只装指定的 skill(用 '*' 全部)
  -l, --list                                # 只列出仓库可用 skill,不安装
  -y, --yes                                 # 跳过确认(非 TTY 必需)
  --copy                                    # 复制而非软链到 agent 目录
  --all                                     # 简写 = --skill '*' --agent '*' -y
  --full-depth                              # 即使根有 SKILL.md 也搜索所有子目录
  --subagent <names>                        # 装到 Eve subagents
```

**作用域**:`-g` 装到 `~/.agents/skills/`(全局,所有项目可用);不带 `-g` 装到当前项目(项目级)。

**典型用法**:

```bash
# 全局装一个仓库的全部 skill
npx skills add vercel-labs/agent-skills -g

# 全局只装某几个 skill
npx skills add mattpocock/skills -g --skill grill-me --skill grilling

# 只看仓库里有哪些 skill(不装)
npx skills add obra/superpowers -l
```

**注意**:安装时可能报 `PromptScript does not support global skill installation`——这是某个 agent 目标不支持全局,不影响 Claude Code。

### `skills init [name]` — 初始化新 skill

```bash
npx skills init <name>     # 创建 <name>/SKILL.md
npx skills init            # 创建 ./SKILL.md
```

### `skills experimental_install` — 从 lock 恢复

```bash
npx skills experimental_install   # 根据 skills-lock.json 恢复项目 skill
```

### `skills experimental_sync` — 从 node_modules 同步

```bash
npx skills experimental_sync      # 把 node_modules 里的 skill 同步到 agent 目录
```

## 更新

### `skills update [skills...]` — 更新到最新版(alias: upgrade)

```bash
npx skills update          # 更新所有已装 skill 到各自远程最新版
npx skills update <name>   # 只更新指定的
npx skills update -g       # 只更新全局
npx skills update -p       # 只更新项目级
npx skills update -y       # 跳过作用域询问
```

> ⚠️ **与 `add` 的区别**:`update` 会**批量拉取所有已装 skill 的上游最新版**(包括 mattpocock、superpowers 等其他源),可能带回不想要的变更。**改完自己的 skill 正本后,用 `add` 精准同步,不要用 `update`。** `update` 适合定期整体跟随上游。

## 查询

### `skills list` — 列出已装 skill

```bash
npx skills list        # 项目级
npx skills list -g     # 全局
```

### `skills find [query]` — 搜索生态

```bash
npx skills find              # 交互式搜索
npx skills find "ui test"    # 带关键词
npx skills find --owner <owner>   # 限定 GitHub owner
```

### `skills use <package>@<skill>` — 不安装,生成使用 prompt

```bash
npx skills use vercel-labs/agent-skills@skill-name
npx skills use <repo>@<skill> -s <skill>    # 指定 skill
npx skills use <repo>@<skill> -a <agent>    # 交互式启动 agent
```

## 移除

### `skills remove [skills]` — 卸载

```bash
npx skills remove <name>     # 移除指定 skill
```

## 本机常用场景

### 改完自己的 skill 正本后同步(日常)

```bash
# 公开 skill 正本在 ~/utils/tkt-skills/,改完 push 后:
npx skills add Manshawar/tkt-skills -g
```

### 外部仓库装指定 skill

```bash
npx skills add mattpocock/skills -g --skill grill-me --skill grilling --skill grill-with-docs --skill to-spec --skill to-tickets --skill implement --skill code-review
npx skills add sanyuan0704/sanyuan-skills -g --skill skill-forge --skill skill-review
npx skills add vercel-labs/skills -g --skill find-skills
```

### 新机器初始化

```bash
# 装 tkt 公开 skill 全家桶
npx skills add Manshawar/tkt-skills -g
# 装外部开发链
npx skills add mattpocock/skills -g --skill grill-me --skill grilling --skill grill-with-docs --skill to-spec --skill to-tickets --skill implement --skill code-review
```

## 判定:哪些 skill 走 npx skills,哪些走 Claude plugin

| 机制 | 判定 | 装到哪 |
| --- | --- | --- |
| **Claude Code plugin** | 仓库根含 `.claude-plugin/`(有 `marketplace.json`) | `claude plugin install <name> -s project` |
| **npx skills** | 顶层 `skills/` 含多个 SKILL.md,无 plugin 声明 | `npx skills add <repo> -g` |

判定法:看目标仓库根目录有没有 `.claude-plugin/`。
