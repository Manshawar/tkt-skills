# Codex CLI/Desktop + Clash Verge 稳定连接配置

这份指南用于 Windows 上通过 Clash Verge/Mihomo 稳定使用 Codex CLI 和 Codex Desktop。
目标是：OpenAI/Codex 流量走代理，国内网站保持直连。

## 推荐架构

```text
Codex CLI/Desktop
        |
        | HTTP / HTTPS / WebSocket
        v
Clash Verge Mixed Port: 127.0.0.1:7890
        |
        +-- OpenAI/ChatGPT 域名 -> 代理节点
        +-- 国内域名/IP       -> DIRECT
```

优先使用 Clash 的 HTTP/Mixed 端口。仅开启 SOCKS 端口时，Codex 的 HTTPS CONNECT 和 WebSocket 可能不稳定。

## Clash Verge 配置

不要直接修改 Clash Verge 生成的 `clash-verge.yaml`，订阅更新或重启时会被覆盖。使用本地 merge profile，例如：

`%USERPROFILE%\\.config\\clash-verge\\profiles\\codex-rules.yaml`

内容：

```yaml
prepend-rules:
  - DOMAIN-SUFFIX,openai.com,一分机场
  - DOMAIN-SUFFIX,chatgpt.com,一分机场
  - DOMAIN-SUFFIX,oaistatic.com,一分机场
  - DOMAIN-SUFFIX,oaiusercontent.com,一分机场
  - DOMAIN-SUFFIX,openaimerge.com,一分机场
  - DOMAIN-SUFFIX,workos.com,一分机场
  - DOMAIN-SUFFIX,workoscdn.com,一分机场
  - DOMAIN,challenges.cloudflare.com,一分机场
```

注意：`一分机场` 只是示例，必须替换成当前配置中实际存在的代理组名称。

确保订阅配置仍保留国内直连和兜底规则：

```yaml
- IP-CIDR,127.0.0.0/8,DIRECT
- IP-CIDR,10.0.0.0/8,DIRECT
- IP-CIDR,172.16.0.0/12,DIRECT
- IP-CIDR,192.168.0.0/16,DIRECT
- GEOIP,CN,DIRECT
- MATCH,DIRECT
```

规则是从上到下匹配的，因此 OpenAI 规则应放在 `GEOIP,CN,DIRECT` 之前。

## Codex CLI 代理环境变量

在 PowerShell 中设置当前终端：

```powershell
$proxy = "http://127.0.0.1:7890"
$env:HTTP_PROXY = $proxy
$env:HTTPS_PROXY = $proxy
$env:ALL_PROXY = $proxy
$env:WS_PROXY = $proxy
$env:WSS_PROXY = $proxy
$env:NO_PROXY = "127.0.0.1,localhost,::1"
```

设置为当前 Windows 用户的持久环境变量：

```powershell
$proxy = "http://127.0.0.1:7890"
foreach ($name in @("HTTP_PROXY","HTTPS_PROXY","ALL_PROXY","http_proxy","https_proxy","all_proxy","WS_PROXY","WSS_PROXY","ws_proxy","wss_proxy")) {
  [Environment]::SetEnvironmentVariable($name, $proxy, "User")
}
[Environment]::SetEnvironmentVariable("NO_PROXY", "127.0.0.1,localhost,::1", "User")
[Environment]::SetEnvironmentVariable("no_proxy", "127.0.0.1,localhost,::1", "User")
```

设置后必须关闭并重新打开终端。已经运行的 Codex 进程不会自动读取新的环境变量。

## Codex CLI 验证

```powershell
codex --version
codex login status
codex doctor --json
```

重点检查：

```text
network.provider_reachability: ok
network.websocket_reachability: ok
```

也可以做一次最小真实请求：

```powershell
codex exec --skip-git-repo-check "Reply with exactly: CODEX_PROXY_OK"
```

如果出现 `Reading additional input from stdin...` 后一直不动，通常是从非交互管道启动；请直接在新的 PowerShell 窗口运行，或使用上面的 `codex exec` 测试。

## TUN 模式

TUN 会接管应用流量，但在 `mode: rule` 下不会强制所有网站走代理：国内规则仍可使用 `DIRECT`。

Codex Desktop 如果不读取系统代理，可以开启 TUN：

```yaml
tun:
  enable: true
  stack: system
  auto-route: true
  auto-detect-interface: true
```

Windows 如果日志出现：

```text
Start TUN listening error: configure tun interface: Access is denied
```

说明 Clash Verge 没有足够权限创建 TUN 网卡。此时可以先关闭 TUN，使用系统代理 + Codex 环境变量；如果 Desktop 仍无法连接，再以管理员身份启动 Clash Verge 并重新开启 TUN。

## 节点选择

不要让 `自动选择` 或 `故障转移` 把“剩余流量”“套餐到期”等信息项选成当前节点。Codex 建议固定到一个稳定、支持 HTTPS/WebSocket 的海外节点，确认 Clash 日志中看到类似：

```text
chatgpt.com:443 ... using 一分机场[某个实际节点]
ws.chatgpt.com:443 ... using 一分机场[某个实际节点]
```

如果 CLI 能登录但模型请求反复 `Reconnecting 1/5`，先把代理组固定到另一个美国、日本或新加坡节点再测试。

## 常见问题

### 登录成功但请求一直等待

登录、模型请求和 WebSocket 可能经过不同连接。确认 `chatgpt.com`、`ws.chatgpt.com` 都走同一个代理组，并检查 `codex doctor --json`。

### 国内网站是否会被影响

只要保持规则模式和 `GEOIP,CN,DIRECT`，国内网站通常继续直连。个别使用海外 CDN 的国内网站可能按域名/IP进入代理，这是分流规则的正常结果。

### 代理节点是否支持 WebSocket

Codex 使用 HTTPS 以及 Responses WebSocket。节点、上游防火墙或 TLS 检查不能阻断 TCP 443 的 WebSocket Upgrade，也不要对 OpenAI 域名做 SSL 解密。

## 安全注意事项

- 不要把订阅链接、订阅 token、API key、`auth.json` 或日志中的 cookie 提交到仓库。
- 文档只保存代理地址、规则模板和验证方法。
- Clash 配置修改前先备份本地 merge profile。

## 参考

- [OpenAI 网络连接要求](https://help.openai.com/en/articles/9247338)
- [OpenAI Codex CLI](https://github.com/openai/codex)
