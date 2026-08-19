# Verify Hooks

PostToolUse hook 由 `tkt-rules` 初始化生成。本 skill 只负责手动触发时的命令建议。

`tkt-rules` 生成的 hook 范围：
- 文件编辑后：typecheck + lint

不挂 hook 的验证：
- 单元测试
- 构建
- e2e

这些由用户根据改动类型手动调用 `/tkt-verify` 获取命令。
