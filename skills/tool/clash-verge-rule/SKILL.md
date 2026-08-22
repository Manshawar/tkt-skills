---
name: clash-verge-rule
description: "管理 Clash 分流规则（白名单模式）。支持 Clash Verge Rev / 旧 Clash Verge / Clash for Windows。当用户说'把 xxx 加到代理'、'把 xxx 加到直连'、'加个规则'、'xxx 走代理'、'xxx 走直连'、'配置 Clash 分流'、'Clash Verge 规则'、'白名单'、'清空规则'、'列出规则'、'配常用规则'、'初始化分流'时使用。支持添加 DOMAIN-SUFFIX / DOMAIN / DOMAIN-KEYWORD 规则、内网域名 DNS 直连、清空和列出规则、一键套用常用白名单模板。"
metadata:
  scope: global
---

# Clash Verge Rule

管理 Clash 的白名单分流规则。当前配置是白名单模式：只有列出的域名走代理，其余全部直连（`MATCH,DIRECT`）。

## IRON LAW

**绝不动白名单核心兜底规则**——最终的 `MATCH,DIRECT`。删掉它，白名单立即失效，所有流量可能走代理。

**绝不改生成文件**——Clash Verge Rev 的 `clash-verge.yaml` 是运行时生成的临时文件，下次重启就被覆盖。旧 Clash Verge / Clash for Windows 的生成文件同理。只改 `profiles/` 下的增强文件或订阅文件。

改完任何文件，必须提醒用户重启核心，否则不生效。

## 客户端与路径

本 skill 同时支持：

| 客户端 | 配置根目录 | 改哪里 |
| --- | --- | --- |
| Clash Verge Rev | macOS: `~/Library/Application Support/io.github.clash-verge-rev.clash-verge-rev/`<br>Windows: `%APPDATA%\io.github.clash-verge-rev.clash-verge-rev\`<br>Linux: `~/.config/io.github.clash-verge-rev.clash-verge-rev/` | `profiles/<rules-uid>.yaml` 增强文件 |
| 旧 Clash Verge / Clash for Windows | macOS/Linux: `~/.config/clash/`<br>Windows: `%APPDATA%\clash\` 或 `%USERPROFILE%\.config\clash\` | `profiles/<timestamp>.yml` 订阅文件 |

详细定位逻辑见 `references/config.md`。

## 常见任务

### 任务 A：一键套用常用白名单规则

当用户说"配常用规则"、"初始化分流"、"国内直连国外代理"、"清理规则"时：

1. 定位当前激活的 profile。
2. 用 `references/common-rules.yaml` 中的规则段替换/追加到 `rules:` 段。
3. 把规则里的代理组名（默认 `一分机场`）改成用户订阅里实际存在的 `select` 组名。
4. 展示改动，确认后写入。
5. 提醒重启核心。

### 任务 B：加/删单条规则

```
Clash Verge Rule Progress:

- [ ] Step 1: 定位配置文件 ⚠️ REQUIRED
- [ ] Step 2: 判断规则类型
- [ ] Step 3: 展示改动，确认 ⚠️ REQUIRED
- [ ] Step 4: 写入规则
- [ ] Step 5: 内网域名 DNS 处理（条件）
- [ ] Step 6: 提醒重启核心
```

#### Step 1: 定位配置文件 ⚠️ REQUIRED

Clash Verge Rev：读 `<config-dir>/profiles.yaml`，找到 `current:` 对应的 `type: remote` 条目，读取 `option.rules`（rules 增强文件 uid）和 `option.merge`（merge 增强文件 uid）。

旧 Clash Verge / Clash for Windows：读 `<config-dir>/profiles/list.yml`，`index` 指向的条目就是当前订阅文件；或直接改最大的那个 `profiles/<timestamp>.yml`。

详细定位逻辑和文件格式见 `references/config.md`。

#### Step 2: 判断规则类型

问自己三个问题：

1. **代理还是直连？** 代理 → 组名；直连 → `DIRECT`
2. **域名还是 IP？** 域名用 `DOMAIN-SUFFIX`/`DOMAIN`；IP 用 `IP-CIDR`
3. **域名怎么匹配？**
   - 整个站点含子域 → `DOMAIN-SUFFIX`（最常用）
   - 只要一个精确域名 → `DOMAIN`
   - 域名含某关键词 → `DOMAIN-KEYWORD`（**只填关键词，绝不带 `https://` 或路径**）

#### Step 3: 展示改动，确认 ⚠️ REQUIRED

先展示要加的规则行（写进 `prepend` 还是 `append`、最终文件长什么样），让用户确认后再写。

⚠️ 规则语法错误会让 mihomo 启动失败。写入前逐行核对格式：`类型,匹配值,目标组`，逗号分隔，无空格。

#### Step 4: 写入规则

- 走代理的规则加进 rules 文件的 `prepend`（优先级最高）
- 直连规则也加 `prepend`，排在代理规则之前
- `append` 和 `delete` 只保留白名单核心两条，不要动（Clash Verge Rev 增强文件场景）

#### Step 5: 内网域名 DNS 处理（条件）

若加的域名是**内网域名**（只能内网 DNS 解析，如公司 `*.qianxin-inc.cn`），只加 DIRECT 规则不够——公共 DNS 解析不了内网域名。需同时在 merge 文件加 DNS 配置，见 `references/config.md`。

#### Step 6: 提醒重启核心

改动不自动生效。告诉用户：托盘图标右键 → 重启 Clash 核心（或退出重开）。给出验证方法：内网站点能打开 = 直连成功，被代理域名走代理。

## Anti-Patterns

- 不要改 `clash-verge.yaml` 等运行时生成文件
- 不要删最终的 `MATCH,DIRECT`（白名单核心）
- 不要写 `DOMAIN-KEYWORD,https://xxx.com/`（关键词不带协议和路径）
- 不要硬编码组名——先从远程配置 `proxy-groups` 里找当前 select 组名
- 不要加完规则就完事——必须提醒重启核心
- 不要直接用 `DOMAIN-SUFFIX,cn,DIRECT` 替代明确的内网域名规则——内网域名还得处理 DNS

## Pre-Delivery Checklist

- [ ] 改动只落在 `profiles/` 下的 rules/merge 增强文件或订阅文件
- [ ] 每条规则格式 `类型,匹配值,目标组`，逗号无空格
- [ ] 白名单兜底 `MATCH,DIRECT` 原样保留
- [ ] 一键套用模板时，代理组名已替换为实际组名
- [ ] 内网域名同步加了 DNS 配置（nameserver-policy + fake-ip-filter）
- [ ] 已提醒用户重启核心并给出验证方法
- [ ] 无占位符残留（TODO、xxx）
