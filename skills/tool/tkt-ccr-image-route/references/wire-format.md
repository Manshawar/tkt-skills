# 含图请求 wire format

Claude Code `Read` 图片 → API `messages` 含 `{"type":"image",...}`（多为 base64 source）。

CCR 规则：

```json
{
  "condition": {
    "left": "request.body.messages",
    "operator": "contains-deep",
    "right": "{\"type\":\"image\"}"
  },
  "target": "Provider/multimodal-model"
}
```

规则 id：`route-image-to-vision`
