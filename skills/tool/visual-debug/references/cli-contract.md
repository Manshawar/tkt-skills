# CLI 输出契约（按需加载）

仅在这些情况读本文件：JSON 解析失败、要写消费代码、或需要 tree 节点字段定义。日常分析不要加载。

`inspect` / `compare` 的 stdout 始终是 JSON。`analyze` 程序化消费必须 `--json`。只读 **stdout**；过程日志在 stderr，禁止把 stderr / `| tail` 截断结果喂给 `json.load`。CLI 已做一次坏 JSON 修复 + 降级重试，不要自己再重试。

## exit code

0 成功 · 1 一般错误 · 2 图片不存在或格式不支持

## inspect / compare

```bash
tkt vision inspect <图> [--from <上轮.json>] [--session <dir>]
tkt vision compare <当前> --target <目标> [--from <上轮.json>] [--session <dir>]
```

```json
{
  "type": "inspect|compare",
  "status": "confirmed|probable|uncertain|pass",
  "summary": "...",
  "confidence": 0.9,
  "layout": { "type": "two-column", "regions": [{ "id": "header", "role": "header", "bbox": [0, 0, 100, 8], "text": "..." }] },
  "issues": [
    {
      "id": "issue-001",
      "category": "layout|position|size|spacing|typography|color|border|radius|shadow|image|icon|responsive|missing|extra",
      "severity": "critical|high|medium|low",
      "target": "main-card",
      "location": "main-card",
      "observation": "卡片间距偏小",
      "description": "卡片间距偏小",
      "expected": "约 24px",
      "actual": "约 16px",
      "suggestion": "增大卡片 grid gap",
      "confidence": 0.91
    }
  ],
  "resolved": ["issue-002"]
}
```

- `target` 与 `location` 同义，`observation` 与 `description` 同义（新旧字段都会填）
- `layout` / `resolved` / `expected` / `actual` / `suggestion` / `category` 无内容时省略
- compare 优先差异，不要当整页重述。`--from` 时已消失的上一轮 id 进 `resolved`
- `--session <dir>` 另写 `dir/iter-N.json`（与 stdout 同一份 payload）
- CLI 按 issues 重算 status：无 issue → `pass`；问题全因 confidence<0.5 被过滤 → `uncertain`；否则最高 confidence ≥0.9 `confirmed` / ≥0.7 `probable` / 其余 `uncertain`
- `issues` 在 pass 或无问题时省略；confidence<0.5 的条目已被 CLI 过滤
- 另附 `provider` / `model` / `durationMs` / `usage`；`reasoning` 仅模型返回思考时存在，调试用，不当结论
- 解析失败且降级后仍非 JSON：`{"parse_error":true,"text":"..."}` → 读 `text` 当纯文本
- 一般错误：`{"error":"..."}`（exit 1；图片问题 exit 2）

severity：结构/位置/缺失 ≥ high，尺寸/间距 ≥ medium，字体/颜色/阴影圆角 ≤ low。suggestion 是方向，不是代码补丁。

`analyze -m ui` 走同一套 inspect 报告。`analyze -m compare --image2` 仍可用；新代码请用 `vision compare --target`。

## 诊断报告（debug / general --json）

旧字段形态仍合法：`severity` / `location` / `description` / `confidence` / `hypothesis` / `next_steps`。解析时会补齐 `target` / `observation` / `id`。

## ocr --json

`{"text":"...","provider":"...","model":"...","durationMs":...,"usage":...}`。无法辨认的字在 `text` 里是 `[unclear]`。

## tree --json

`{"tree":{...}}` + 调用元信息。解析失败同样降级；`--out` 时 parse_error 原文也会写入缓存，可手工修复后 `--tree` 复用。

节点：`id`（n1 / n1.1 / n1.1.2）/ `role` / `bbox`（整图百分比 `[x,y,w,h]` 0~100，不是 px）。可选 `text` / `color` / `bg` / `fontScale`（正文=1.0）/ `spacing`（none|tight|normal|wide）/ `confidence`（省略视为 1.0）/ `children`。

树是近似测绘：色值可能偏一档、bbox 是估算。定结构和相对关系；1~2px 不要依赖树。不是复刻主路径。

`--node` + `--tree`：细化子树合并回缓存，子 bbox 换算为整图百分比。未传 `--out` 则原地更新 `--tree`。
