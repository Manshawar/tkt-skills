# CCR 初始化 — 踩坑清单

## 进程与端口

1. **`ccr start` vs launchd**  
   launchd 占 `3456`。再跑 `ccr start --daemon-child` → EADDRINUSE / UI 假死。  
   **只** `launchctl kickstart -k gui/$UID/com.*.ccr`。禁止 `ccr start`。

2. **CCR 没监听**  
   `claude` 指向 `127.0.0.1:3456` 但端口无进程 → 连接失败。先 doctor 看 `ccr_port_listen`。

## 鉴权

3. **shell `ANTHROPIC_AUTH_TOKEN` / `ANTHROPIC_API_KEY`**  
   会盖 CCR WIF → 401。新终端 `env | rg ANTHROPIC` 应干净；Cursor 继承旧 key 时重启 IDE。

4. **`apiKeyHelper` 被删**  
   CCR WIF 模式可能同步删掉 helper。设 `CCR_CLAUDE_CODE_AUTH_MODE=api-key-helper`；helper 脚本由 CCR profile 生成，路径在 `~/.claude-code-router/bin/`。

5. **读图后 Not logged in**  
   常叠加：`settings.model=fable`（走 Anthropic 登录）+ helper 缺失。主模型改 **Provider/model 全名**。

6. **双 token 警告**  
   settings 里 API_KEY 与 AUTH_TOKEN 并存。cc-switch 供应商只保留一种；见 `tkt-cc-setup`。

## 模型与路由

7. **短名别名**  
   `settings.model=fable/haiku/sonnet/opus` 易触发登录态/映射混乱。主模型用 `qax/deepseek-v4-flash` 这类全名。

8. **只改 FABLE 槽位**  
   不等于读图修好；非 Fusion 含图见 `docs/ccr-image-route-backup.md`。

9. **cc-switch 覆盖 settings**  
   只改 `~/.claude/settings.json` 白改。必须同步 `common_config_claude` + 当前供应商 `settings_config`。本 skill apply 会同步。

## 网络

10. **`proxy.upstream.mode=system`**  
    Clash `7897` 未起 → 502 upstream_connect。新环境默认 `none`。

## 上下文

11. **qax 等默认非 1M**  
    需 CCR `Providers[].modelMetadata.contextWindow` + `CLAUDE_CODE_MAX_CONTEXT_TOKENS` 一致。apply 带 `--context-tokens 1000000`。

## 新电脑顺序

1. 安装 `@musistudio/claude-code-router`，CCR UI 配好 Providers  
2. 启用 launchd（CCR「登录时启动」或 `references/launchd.md`）  
3. **`tkt-ccr-init`** doctor → apply `--main-model`  
4. **`tkt-cc-setup`**（可选）HUD / 底部栏  
5. **`docs/ccr-image-route-backup.md`**（可选）— 非 Fusion 时 Read 含图转发
6. **`tkt-vision-agent`**（可选）— 与 CCR 无强绑定
