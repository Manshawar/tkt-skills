# 验证 / 测试

按改动类型选验证层级（成本从低到高），能跑的最低层级先跑，失败立即停：

| 改动类型 | 验证步骤 |
|---|---|
| 语法/类型 bug | `typecheck` |
| 风格/规范调整 | `typecheck` → `lint` |
| 功能点实现 | `typecheck` → `lint` → `unit test` |
| 模块级改动 | `typecheck` → `lint` → `unit test` → `build` |
| 用户流程改动 | `typecheck` → `lint` → `unit test` → `build` → `e2e` |

> 项目无 e2e 基础设施时，先跑 `/tkt-e2e-init` 初始化，再走 e2e 层。
