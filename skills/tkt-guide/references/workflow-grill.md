# Grill 工作流

80% 场景走这条链：

grill-me / grill-with-docs → to-spec → to-tickets → implement → code-review

每个阶段缺失时，给用户对应 `npx skills add` 命令，不替用户安装。

## 全局安装命令

```bash
npx skills add mattpocock/skills -g \
  --skill grill-me \
  --skill grilling \
  --skill grill-with-docs \
  --skill to-spec \
  --skill to-tickets \
  --skill implement \
  --skill code-review
```

## 各阶段命令

| 阶段 | 命令 |
|---|---|
| 需求澄清 | `/grill-me` 或 `/grill-with-docs` |
| 写规格 | `/to-spec` |
| 拆任务 | `/to-tickets` |
| 实现 | `/implement` |
| 验收 | `/tkt-socratic` (新功能/接口/数据流改动时) |
| 验证 | `/tkt-verify` |
| 评审 | `/code-review` |
