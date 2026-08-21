# Commit Hook 冒烟(diff 驱动)

冒烟 = 提交前 diff 选例,只跑这次改动的用例。**Claude Code 提交触发,手动 `git commit` 不触发**。

## 边界

- Claude Code 里让 Claude 提交 → 触发冒烟,失败 `exit 2` 阻止 commit
- 手动 `git commit`(终端)→ 不触发
- 无关联改动(纯文档/注释,没配 files)→ 跳过

## hook 脚本 `.claude/hooks/check-commit.sh`

初始化时按此模板生成(选例逻辑内联,不写 e2e/ 单独脚本、不依赖 tkt):

```bash
#!/usr/bin/env bash
set -euo pipefail

# 读 PreToolUse stdin,判断是否 git commit
command=$(jq -r '.tool_input.command // ""' 2>/dev/null || true)
[[ "$command" == *"git commit"* ]] || exit 0

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

if [ -z "$names" ]; then
  echo "无关联改动,冒烟跳过" >&2
  exit 0
fi

cd e2e && pnpm exec playwright test -g "$names" >&2 || {
  echo "冒烟未通过,已阻止提交。请先修复失败用例。" >&2
  exit 2
}
```

## hook 配置 `.claude/settings.json`

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{ "type": "command", "command": "bash .claude/hooks/check-commit.sh" }]
      }
    ]
  }
}
```

## 要点

- **选例靠 cases.json 的 `files`**(源码 glob):改这些文件 → 冒烟跑对应用例;`files` 由 tkt-test-gen 生成用例时登记
- **改 spec 文件本身** → 命中整 spec(整文件用例)
- **matcher `Bash` + 脚本判 `git commit`** —— 只拦 Claude Code 的 Bash 提交,不拦手动
- 冒烟失败 `exit 2` 终止 Bash 调用,错误回传 Claude 修
