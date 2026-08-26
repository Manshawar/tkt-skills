# cc-switch 与 CCR 同步

`tkt-ccr-init` apply 会写三处（与 `tkt-cc-setup` 互补）：

| 位置 | 字段 |
| --- | --- |
| `~/.claude/settings.json` | `env.ANTHROPIC_*_URL`、`CCR_CLAUDE_CODE_AUTH_MODE`、`CLAUDE_CODE_MAX_CONTEXT_TOKENS`、`model`、`apiKeyHelper` |
| `cc-switch.db` → `common_config_claude` | 同上共享 env + model |
| 每个 Claude 供应商 `settings_config` | 合并 env，避免一切换丢 CCR 地址 |

## 与 tkt-cc-setup 分工

| Skill | 管什么 |
| --- | --- |
| **tkt-ccr-init** | CCR 端口、proxy、鉴权、主模型、Provider contextWindow |
| **tkt-cc-setup** | claude-hud statusLine、人民币、火山用量行 |
| **tkt-ccr-image-route** | 仅含图 Router 转发（主供应商无多模态时） |
| **tkt-vision-agent** | vision-analyst + CLAUDE.md 视觉段（不依赖 CCR） |

先 init，再 setup/vision。
