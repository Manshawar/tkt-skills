# CCR 含图转发 — 何时需要

**仅当**：主会话供应商/模型 **不支持多模态**，但你要用 `Read` 看本地图片时。

CCR 在 API body 含 `type:image` 时，把该请求 **rewrite** 到你指定的多模态 `Provider/model`。

**不需要** 的情况：

- 主模型已能原生看图 → 直接 Read，不必写规则
- 多轮改 UI → 用 `vision-analyst` 子 agent（与 CCR 无强绑定）
- 没有装 CCR → 换主模型到多模态

# 踩坑

1. 规则 `enabled: false` → Read 仍走主模型
2. 不要用 `fable` 短名作 target；用 `Provider/model` 全名
3. 禁止 `ccr start` 抢 launchd 3456
4. UI 旁路路径文本不算；路由只看 body 里 `type:image`
5. 只有 **含图那一跳** 转发；后续纯文本追问仍在主模型

# wire format

见 `wire-format.md`
