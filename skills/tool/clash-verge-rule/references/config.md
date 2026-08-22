# Clash Verge Rev 配置速查

## 目录结构（跨平台）

不同客户端/系统的配置根目录：

| 系统 | Clash Verge Rev | 旧 Clash Verge / Clash for Windows |
| --- | --- | --- |
| macOS | `~/Library/Application Support/io.github.clash-verge-rev.clash-verge-rev/` | `~/.config/clash/` |
| Windows | `%APPDATA%\io.github.clash-verge-rev.clash-verge-rev\` | `%APPDATA%\clash\` 或 `%USERPROFILE%\.config\clash\` |
| Linux | `~/.config/io.github.clash-verge-rev.clash-verge-rev/` | `~/.config/clash/` |

下文用 `<config-dir>` 指代上述根目录。Clash Verge Rev 的结构：

```
<config-dir>/
├── config.yaml            # 运行时基础配置（mode、端口、TUN 等）
├── verge.yaml             # 应用设置（自启、系统代理、代理守护）
├── profiles.yaml          # profile 列表 + current 指针 + 各增强文件 uid
├── clash-verge.yaml       # 生成文件，mihomo 实际加载。不要改
└── profiles/
    ├── <uid>.yaml         # 远程订阅（完整 rules/proxies/groups/dns）
    ├── <uid>.yaml         # rules 增强文件
    ├── <uid>.yaml         # merge 增强文件
    └── ...
```

旧 Clash Verge / Clash for Windows 的结构：

```
<config-dir>/
├── config.yaml            # 端口、external-controller、secret
├── profiles/
│   ├── list.yml           # profile 列表，含 index 指向当前订阅
│   ├── <timestamp>.yml    # 远程订阅文件
│   └── <timestamp>.yml    # 本地配置
└── ...
```

## 常用规则模板（白名单模式）

见 [`common-rules.yaml`](./common-rules.yaml)。复制其中 `rules:` 段内容到目标 profile 的 `rules:` 段即可：

- 国内域名/IP、局域网全部 `DIRECT`
- 常见国外/被墙服务走代理组（默认示例名 `一分机场`，按实际订阅改）
- 兜底 `MATCH,DIRECT`

旧 Clash Verge / Clash for Windows 直接改 `profiles/<timestamp>.yml` 的 `rules:` 段；Clash Verge Rev 优先写到 rules 增强文件，保持订阅原文件不被覆盖。

### 最小化白名单规则段示例

```yaml
rules:
  - 'DOMAIN-SUFFIX,local,DIRECT'
  - 'IP-CIDR,127.0.0.0/8,DIRECT'
  - 'IP-CIDR,172.16.0.0/12,DIRECT'
  - 'IP-CIDR,192.168.0.0/16,DIRECT'
  - 'IP-CIDR,10.0.0.0/8,DIRECT'
  - 'DOMAIN-SUFFIX,cn,DIRECT'
  - 'DOMAIN-KEYWORD,-cn,DIRECT'
  - 'GEOIP,CN,DIRECT'
  # ... 上面 common-rules.yaml 中的代理规则 ...
  - 'MATCH,DIRECT'
```

## 定位要改的增强文件（Clash Verge Rev）

读 `<config-dir>/profiles.yaml`：

1. `current:` 的值 = 当前激活的 profile uid（例：`RZJGOYLzktmI`）
2. 在 `items` 里找 `uid == current` 且 `type: remote` 的条目
3. 它的 `option.rules` = rules 增强文件 uid，`option.merge` = merge 增强文件 uid
4. 文件实际路径 = `profiles/<uid>.yaml`

例（profiles.yaml 片段）：

```yaml
current: RZJGOYLzktmI
items:
  - uid: rh0bfeqKDf19
    type: rules
    file: rh0bfeqKDf19.yaml
  - uid: mhUKyknqgRkR
    type: merge
    file: mhUKyknqgRkR.yaml
  - uid: RZJGOYLzktmI
    type: remote
    option:
      rules: rh0bfeqKDf19      # ← 改这个 rules 增强文件
      merge: mhUKyknqgRkR      # ← 改这个 merge 增强文件
```

## rules 增强文件格式

```yaml
prepend:                          # 插到规则最前，优先级最高
  - 'DOMAIN-SUFFIX,qianxin-inc.cn,DIRECT'      # 内网直连
  - 'DOMAIN-SUFFIX,music.163.com,DIRECT'       # 国内服务直连
  - 'DOMAIN-SUFFIX,chatgpt.com,一分机场'        # 走代理（组名）
append:
  - 'MATCH,DIRECT'                 # 白名单核心：未匹配全部直连，勿动
delete:
  - 'MATCH,一分机场'                # 白名单核心：删掉订阅的全局代理 MATCH，勿动
```

规则格式：`类型,匹配值,目标组`，逗号分隔，无空格。

- `DOMAIN-SUFFIX,xxx.com` — 匹配 xxx.com 及所有子域（最常用）
- `DOMAIN,xxx.com` — 只精确匹配该域名
- `DOMAIN-KEYWORD,xxx` — 域名含关键词（只填关键词，不带 `https://` 或路径）
- `IP-CIDR,1.2.3.0/24` — IP 段
- 目标组 `DIRECT` = 直连；组名 = 走代理

## 代理组名查找

从远程订阅配置（`profiles/<remote-uid>.yaml`）的 `proxy-groups:` 里，找 `type: select` 的第一个组，`name` 字段就是组名（例：`一分机场`）。规则目标组填这个名。不要硬编码——换订阅组名会变。

## DNS 处理（merge 增强文件）

### nameserver: system（关键：公司内网环境）

公司内网防火墙常拦截**直连**公共 DNS（`223.5.5.5` 等 53 端口）。此时所有走 DIRECT 的域名（国内网站）DNS 解析超时打不开，而走代理的域名（DNS 走代理节点，绕过防火墙）正常。

修复：merge 文件把 `nameserver` 和 `default-nameserver` 改成 `system`，让域名用系统 DNS（内网 DNS）解析：

```yaml
dns:
  default-nameserver:
    - system
  nameserver:
    - system
```

⚠️ 陷阱：`direct-nameserver: system` 语法能通过 `-t` 测试，但运行时**不生效**——mihomo 不支持 `direct-nameserver` 的 `system` 值，仍回退用 `nameserver` 里的公共 DNS。必须改 `nameserver`，不能只改 `direct-nameserver`。

诊断方法：`/dns/query` 测国内域名返回 `context deadline exceeded`，同时 `dig +short 域名 @223.5.5.5` 也超时 = 公共 DNS 被拦。看 `logs/service/` 日志，出现 `[UDP] mihomo --> 223.5.5.5:53 match GeoIP(cn) using DIRECT` 说明还在查公共 DNS。

### 内网域名 fake-ip + nameserver-policy

内网域名（如公司 `*.qianxin-inc.cn`）只有内网 DNS 能解析。只加 DIRECT 规则不够，还需在 merge 文件加：

```yaml
dns:
  fake-ip-filter:
    - '+.qianxin-inc.cn'
  nameserver-policy:
    '+.qianxin-inc.cn': system
```

- `fake-ip-filter` — 排除该域名的 fake-ip 劫持，返回真实 IP
- `nameserver-policy: system` — 该域名用系统 DNS（内网 DNS）解析

判断是否内网域名：`dig +short 域名` 能解析出内网 IP（10.x / 172.16-31.x / 192.168.x）而公共 DNS（`dig +short 域名 @223.5.5.5`）解析失败或超时。

## 验证命令

mihomo 二进制：`/Applications/Clash Verge.app/Contents/MacOS/verge-mihomo-alpha`

```bash
# 测试配置语法（改完增强文件后，可先用最小配置验证新语法，如 nameserver-policy 的 system 值）
"/Applications/Clash Verge.app/Contents/MacOS/verge-mihomo-alpha" -t -f /tmp/test.yaml

# 查运行时 mode（通过 unix socket）
curl -s --unix-socket /tmp/verge/verge-mihomo.sock \
  -H "Authorization: Bearer set-your-secret" \
  http://localhost/configs | grep -o '"mode":"[^"]*"'
```

## 应用设置（verge.yaml）

「一直开着」相关字段：

```yaml
enable_auto_launch: true     # 开机自启
enable_silent_start: true    # 静默启动
enable_system_proxy: true    # 系统代理常开
enable_proxy_guard: true     # 代理守护
```

`mode` 在 `config.yaml` 里，白名单分流必须 `mode: rule`（不能是 `global`）。
