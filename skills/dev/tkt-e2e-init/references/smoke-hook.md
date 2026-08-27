# Commit Hook 冒烟(diff 驱动)

> **默认不启用。** e2e 用例未沉淀前,hook 永远「无关联改动跳过」、空转。仅当用户已用 tkt-test-gen 攒出入库用例(cases.json 有 files 关联)、并明确要提交时自动回归,才按本文现场生成。

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
# ⚠️ 不要用 jq 解析 stdin:环境缺 jq 时 command 恒空 → 永远 exit 0 → 冒烟静默失效(已踩坑)
command=$(node -e '
let s = ""
process.stdin.on("data", (c) => (s += c))
process.stdin.on("end", () => {
  try { process.stdout.write(JSON.parse(s).tool_input?.command ?? "") }
  catch { process.exit(0) }
})
' 2>/dev/null || true)
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

## 静默失效警告(必读)

hook 链路里任何一环依赖环境里**不存在的工具**(如 jq),失败被 `2>/dev/null` / `|| true` 吞掉 → gate 永远放行,UI 改动从此不跑 e2e。toolkit 曾因此长期空转(jq 缺失,command 恒空,smoke.sh 从未运行)。

**验证纪律**:改冒烟脚本 / hook 后,必须**实测整链真触发**——
1. `git add` 一个会被 cases.json files 命中的文件
2. 跑 hook 入口(`echo '{"tool_input":{"command":"git commit -m t"}}' | bash .claude/hooks/check-commit.sh`)
3. 确认 playwright 真的被调用并跑对应用例(不是「无关联改动跳过」也不是 exit 0 静默)
只看脚本 exit 0 不算验证——空转也 exit 0。
