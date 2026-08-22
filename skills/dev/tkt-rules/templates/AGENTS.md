# {{projectName}} — {{oneLiner}}

{{techStack}}

## 常用命令

- `{{devCommand}}`: 启动开发
- `{{testCommand}}`: 测试
- `{{buildCommand}}`: 构建
- `{{typecheckCommand}}`: 类型检查

## 项目结构

- `{{srcDir}}`: 源码
- `{{testDir}}`: 测试
- `{{configDir}}`: 配置

## 重要约定

{{specialRules}}

## 实现纪律

- 优先使用项目现有的工具函数和依赖
- 不要为单一实现引入接口抽象

## 公司私有规范

若项目根存在 `.tkt/company/` 目录，按需 Read 其中对应文件，不要一次性加载全部。

## 文档指引

- 设计/规格/任务产物落 `docs/{design,spec,tickets}/NNN-描述.md`
- 认证相关改动先读 `docs/auth-patterns.md` (若存在)
- 行为打点相关改动先读 `docs/tracking.md` (若存在)
