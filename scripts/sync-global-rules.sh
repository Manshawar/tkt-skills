#!/usr/bin/env bash
# PostToolUse hook:监听 Claude 修改全局 CLAUDE.md 正本,单向同步到 cursor 镜像 + tkt-skills。
# 调用方式(hook 配置):bash /Users/manshawar/utils/tkt-skills/scripts/sync-global-rules.sh
# stdin 是 Claude Code 传来的 PostToolUse JSON,用 jq 读 tool_input.file_path。
set -euo pipefail

file=$(jq -r '.tool_input.file_path // empty' 2>/dev/null || true)
if [[ "$file" != "$HOME/.claude/CLAUDE.md" ]]; then
  exit 0 # 非正本改动,不动
fi

TKT_SKILLS="/Users/manshawar/utils/tkt-skills"

# 1. cursor 镜像(带 YAML frontmatter)
{
  printf -- '---\ndescription: 全局协作规则 — 回复风格 + Session Receipt\nalwaysApply: true\n---\n\n'
  cat "$HOME/.claude/CLAUDE.md"
} > "$HOME/.cursor/rules/global.mdc"

# 2. tkt-skills 全局文件夹(纯正文,无 frontmatter)
mkdir -p "$TKT_SKILLS/global"
cp "$HOME/.claude/CLAUDE.md" "$TKT_SKILLS/global/CLAUDE.md"

# 3. git commit + push(无变化则跳过;push 失败不阻塞)
cd "$TKT_SKILLS"
git add global/CLAUDE.md
if git diff --cached --quiet; then
  exit 0
fi
git commit -m "docs(global): 同步全局协作规则" || true
git push || true
