# Verify Pipeline

按成本从低到高排序：

| 改动类型 | 验证步骤 |
|---|---|
| 语法/类型 bug | `typecheck` |
| 风格/规范调整 | `typecheck` → `lint` |
| 功能点实现 | `typecheck` → `lint` → `unit test` |
| 模块级改动 | `typecheck` → `lint` → `unit test` → `build` |
| 用户流程改动 | `typecheck` → `lint` → `unit test` → `build` → `e2e` |

## 原则

- 能跑的最低层级先跑，失败立即停
- 高层级验证只在低层级通过后执行
- e2e 只在用户流程改动时触发
