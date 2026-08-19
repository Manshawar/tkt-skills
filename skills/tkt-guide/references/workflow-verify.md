# 验证 / 测试

调用 `/tkt-verify` 获取验证命令。

按改动类型选择验证层级：

| 改动类型 | 验证步骤 |
|---|---|
| 语法/类型 bug | `typecheck` |
| 风格/规范调整 | `typecheck` → `lint` |
| 功能点实现 | `typecheck` → `lint` → `unit test` |
| 模块级改动 | `typecheck` → `lint` → `unit test` → `build` |
| 用户流程改动 | `typecheck` → `lint` → `unit test` → `build` → `e2e` |
