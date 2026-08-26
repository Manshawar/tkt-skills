## 视觉与子 agent（tkt-vision-agent 维护）

vision-analyst 默认模型：`{{VISION_MODEL}}`（`apply --model` 可改）

### 分工

| 任务 | 谁做 |
| --- | --- |
| 写页面 / 改 UI / 多轮看→改 template·style | **vision-analyst**（一次派发）；逻辑/API/store **归主 agent** |
| 单次识图、OCR、browser 截图认一眼 | **主 agent** `Read` + 绝对路径 |
| 接口、算法、鉴权 | **主 agent** |

### 铁律

1. **禁止** base64 / data URI 贴图 → 只用 `Read` + 绝对路径
2. 主模型 **已能原生看图** → 主线程 Read，不派 vision-analyst
3. 主模型 **不能看图** → 单次识图可用 **`tkt-ccr-image-route`**（可选）；多轮改 UI 派 vision-analyst
4. **不确定**是否多模态 → 先问用户
5. agent-browser：优先 snapshot；**不要**每张截图都派子 agent

### 与 CCR

**无强绑定。** CCR 只在「主供应商不支持多模态、又要 Read 识图」时作转发；装 vision-analyst **不需要** CCR。

### 子 agent 边界

- 只改 template / style / 布局
- handoff 的 `Logic deferred to main` 由主 agent 接手
