# Grill / 实现工作流

## 需求明确（边界清楚）

跳过 grill / 规格链。小改动（单文件/单行为）直接实现，验证走 `typecheck → build`；用户流程改动（页面/API）加 `e2e`（层级见 workflow-verify.md）。新功能/新 API 完成后再走验收（`/tkt-socratic`）。

## 需求模糊 / 方案探讨 / 写规格拆任务

走开发链：grill-me → to-spec → to-tickets → implement → code-review

- 与项目 AGENTS.md「常用流程」同链，此处只路由不展开
- 环节缺失时给 `npx skills add` 命令，不替用户安装（命令见 external-deps.md）

## 各阶段命令速查

| 阶段 | 命令 |
|---|---|
| 需求澄清 | `/grill-me` 或 `/grill-with-docs` |
| 写规格 | `/to-spec` |
| 拆任务 | `/to-tickets` |
| 实现 | `/implement` |
| 验收 | `/tkt-socratic`（新功能/接口/数据流改动时） |
| 评审 | `/code-review` |
