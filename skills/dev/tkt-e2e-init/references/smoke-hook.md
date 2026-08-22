# Commit Hook 冒烟(diff 驱动)

冒烟 = 提交前 diff 选例,只跑这次改动的用例。**冒烟脚本环境无关(核心逻辑),hook 接入由 AI 检测当前环境现场生成,不写死绑定。**

## 冒烟脚本(环境无关,skill 提供模板)

`.hooks/smoke.sh` —— 只做「diff 选例 + playwright -g」,不关心谁调它:

```bash
#!/usr/bin/env bash
set -euo pipefail

# cwd 无关:固定到仓库根(相对路径 cases.json / git diff 都以仓库根为基准)
cd "$(git rev-parse --show-toplevel)"

# diff 选例:staged 改动 → cases.json files glob → 用例名
names=$(node --input-type=module -e '
import fs from "node:fs"
import { execSync } from "node:child_process"
const cases = JSON.parse(fs.readFileSync("e2e/cases.json", "utf8"))
const changed = execSync("git diff --cached --name-only", { encoding: "utf8" })
  .trim().split("\n").filter(Boolean)
if (!changed.length) process.exit(0)
const glob = (g) => {                 // ** 跨目录 / * 单层 / ? 单字符
  let r = "^"
  for (let i = 0; i < g.length; i++) {
    const c = g[i]
    if (c === "*") { r += g[i + 1] === "*" ? (i++, ".*") : "[^/]*" }
    else if (c === "?") r += "[^/]"
    else r += c.replace(/[.+^${}()|[\]\\]/g, "\\$&")
  }
  return new RegExp(r + "$")
}
const esc = (n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
const names = new Set()
const changedSpecs = new Set(changed.filter(f => f.startsWith("e2e/") && f.endsWith(".spec.ts")).map(f => f.split("/").pop()))
for (const [name, meta] of Object.entries(cases)) {
  const specHit = meta.spec && changedSpecs.has(meta.spec)
  const filesHit = meta.files?.some((f) => changed.some((c) => glob(f).test(c)))
  if (specHit || filesHit) names.add(name)
}
console.log([...names].map(esc).join("|"))
')

if [ -z "$names" ]; then echo "无关联改动,冒烟跳过" >&2; exit 0; fi
cd e2e && pnpm exec playwright test -g "$names"
```

## hook 接入(环境相关,AI 现场判断)

AI 检测当前环境,按对应方式生成 hook,**都调上面的 smoke.sh**:

| 检测到 | hook 接入 |
|---|---|
| `.claude/` | Claude Code PreToolUse(监听 Bash 的 `git commit`,只拦 Claude 提交) |
| `.cursor/` | Cursor Enforcement Hooks(`.cursor/hooks.json`,Enterprise) |
| 都没有 | Git pre-commit(通用兜底,所有 commit 都拦) |

### Claude Code(检测到 `.claude/`)

`.claude/hooks/check-commit.sh`(判断是否 commit → 调 smoke):
```bash
#!/usr/bin/env bash
command=$(jq -r '.tool_input.command // ""' 2>/dev/null || true)
[[ "$command" == *"git commit"* ]] || exit 0
cd "$(git rev-parse --show-toplevel)" 2>/dev/null || exit 0
bash .hooks/smoke.sh || { echo "冒烟未通过,已阻止提交。" >&2; exit 2; }
```

`.claude/settings.json`:
```json
{ "hooks": { "PreToolUse": [
  { "matcher": "Bash", "hooks": [{ "type": "command", "command": "bash .claude/hooks/check-commit.sh" }] }
] } }
```

### Git 兜底(无 .claude/ 无 .cursor/)

`.git/hooks/pre-commit`:
```bash
#!/usr/bin/env bash
bash .hooks/smoke.sh || exit 2
```

## 要点

- **脚本环境无关,hook 环境相关**:smoke.sh 只管「选例 + 跑」,hook 接入由 AI 现场检测环境生成,不写死 Claude Code / Cursor
- **Claude Code 的 PreToolUse 只拦 Claude 的 Bash commit**,手动 `git commit` 不触发;Git 兜底则手动也拦
- 选例靠 cases.json 的 `files`(源码 glob)+ `spec`(用例所在 spec 文件名):改 files 覆盖的源码 → 跑对应用例;改 spec 文件 → 跑该 spec 全部用例
- **只查 staged 改动**(`git diff --cached`):commit 前必须先 `git add`;`git commit -a` 未先 add 会漏选,不拦
- 冒烟失败 exit 非 0,hook 层转 exit 2 阻止提交,错误回传 AI 修
