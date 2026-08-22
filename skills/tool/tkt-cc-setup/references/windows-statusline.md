# Windows statusLine（本机 Git Bash）

Claude Code 2.1.x 在 win32 上跑 `statusLine.command` 走 **Git Bash**，不走 cmd。

## 能用的命令

```
/c/nvm4w/nodejs/node C:/Users/<user>/.claude/plugins/claude-hud/statusline.mjs
```

- node 用 Git Bash 路径（`/c/...`），或正斜杠 Windows 路径
- 本机 node 常见：`C:\nvm4w\nodejs\node.exe` → `/c/nvm4w/nodejs/node`
- 以 `where node` / `process.execPath` 为准，不要写死别人的盘符

## 不能用

| 写法 | 结果 |
| --- | --- |
| `C:\Windows\System32\cmd.exe /d /s /c "..."` | bash 吃掉反斜杠，静默无输出 |
| `node ~/.claude/statusline.js` | 旧一行栏（`目录 \| 模型 \| ctx N%`），不是 HUD |
| 只写 `node ...` 且 Git Bash PATH 里没有 node | 静默失败 |

`/claude-hud:setup` 按 OSTYPE 可能写成 cmd.exe 启动器。本机不要用它收尾，用 `scripts/apply.mjs`。

## 怎么从底部判断

| 看到 | 实际 command |
| --- | --- |
| 多行：Context 进度条 / 工具 / 用量 | `statusline.mjs`（HUD） |
| 一行：`目录 \| 模型 \| ctx N%` | `statusline.js`（旧脚本） |
| 一行：`repo \| model`，无 ctx% | Claude 默认 footer，statusLine 没跑起来 |

改完必须退出重开 `claude`。热重载常仍执行旧 command。
