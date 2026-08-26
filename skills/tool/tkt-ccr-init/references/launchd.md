# launchd 管 CCR

## 推荐

- CCR 桌面端勾选 **登录时启动**，或手动安装 `~/Library/LaunchAgents/com.*.ccr.plist`
- plist 应跑 `node .../claude-code-router/dist/main/cli.js serve --no-open`
- 重载：`launchctl kickstart -k "gui/$(id -u)/com.YOUR.ccr"`

## 禁止

- 日常不要用 `ccr start`（会与 launchd 抢 3456）
- 不要同时留 `--daemon-child` 残留进程

## doctor 信号

| 检查 | 含义 |
| --- | --- |
| `launchd_label` warn | 无 plist，需手动配 launchd 或 CCR 自启 |
| `ccr_start_conflict` warn | 有 daemon-child，可能双实例 |
| `ccr_port_listen` fail | CCR 未起来，先 kickstart 或查 `~/.claude-code-router/logs/` |

## 日志

- `~/.claude-code-router/logs/launchd.out.log`
- `~/.claude-code-router/logs/launchd.err.log`
