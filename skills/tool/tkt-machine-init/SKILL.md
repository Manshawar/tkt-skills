---
name: tkt-machine-init
description: "新机器 / 重装系统后的本机开发环境初始化——探测平台(macOS/Windows/Linux),按清单逐项补齐缺失工具链,产出「该装/不该装」对照表。Actions: 初始化, 装环境, 补环境, 配环境, 新电脑, 重装系统, 换机器, 迁移环境, init, bootstrap, set up machine。Objects: brew/Homebrew, winget, scoop, choco, apt, Linuxbrew, oh-my-zsh, nvm/fnm, node, pnpm, npm 全局包, go 工具, rustup/cargo, VS Code 扩展, cc-switch CLI, Claude Code, Codex。Triggers: 新电脑初始化, 重装完系统该装什么, 帮我把环境配上, 换台电脑怎么装, 遗留环境没装, 环境初始化, 新机器要装哪些工具, /tkt-machine-init。"
metadata:
  scope: global
---

# tkt-machine-init

IRON LAW:

- **装前必探测**——先查这个包/工具在这台机器上有没有，**已装的跳过**，不重装、不覆盖用户既有配置
- **oh-my-zsh 只用 `git clone`**，**禁止**跑官方 `install.sh`（它会用模板覆盖 `.zshrc`，抹掉用户全部自定义）
- **secret 只记结构不记值**——API key / `GITHUB_TOKEN` / WiFi 密码一律不写进本 skill、不回显；正文只写「哪一行需要恢复」
- **平台不匹配的包不硬装**——cask 在 Linux/Windows 上不存在，apt 包在 macOS 上不存在；先读对应平台的 inventory

Red Flags（出现就停，回 Step 1）:

- 直接 `brew bundle install` 整个 Brewfile（会把 llvm/gcc/miniconda 这些明确不装的重型包一起拉下来）
- 跑 oh-my-zsh 官方 `install.sh`
- 输出或落盘完整 API key / token（只报前缀 + 长度）
- 在 Windows/Linux 上照搬 macOS 包名（`cask`、`brew leaves` 那套）
- 没探测就开装
- 把 CC / cc-switch 的**配置**也一起改（那是 `tkt-cc-setup`、`tkt-cc-provider-switch` 的职责）

## 职责边界

本 skill **只装工具**。以下明确不做：

| 不做 | 归谁 |
| --- | --- |
| Claude Code / cc-switch 配置数据、HUD、供应商切换 | `tkt-cc-setup` / `tkt-cc-provider-switch` |
| CCR 初始化（launchd、3456） | `tkt-ccr-init` |
| 恢复 shell 配置里的 secret 值 | 用户手动（本 skill 只提示「哪一行缺」） |
| Clash 分流规则 | `clash-verge-rule` |
| 项目级 `AGENTS.md` / `CLAUDE.md` | `tkt-rules` |

## 模式

| 用户说法 | 做什么 |
| --- | --- |
| 新电脑初始化 / 重装完装环境 | Step 1 → 5 全流程 |
| 遗留环境没装 / 补一下环境 | Step 1 → 2 → 3，只补缺失项 |
| 只想知道要装哪些 / 出个清单 | Step 1 → 2，出对照表，**不装** |
| 那台机器是 Windows / Linux | Step 1 认平台，读对应 inventory 分支 |

## Workflow

```
tkt-machine-init Progress:

- [ ] Step 1: 探测平台 + 现状 ⚠️ REQUIRED
- [ ] Step 2: 出「待装清单」给用户确认 ⛔ BLOCKING
- [ ] Step 3: 按依赖顺序逐项安装
- [ ] Step 4: 跑 pitfalls 自检 ⚠️ REQUIRED
- [ ] Step 5: 收尾产出对照表
```

## Step 1: 探测平台 + 现状 ⚠️ REQUIRED

先认平台，再认包管理器，最后认已装。

```bash
uname -s                                    # Darwin / Linux
uname -m                                    # arm64 / x86_64 —— 影响 brew 前缀与 cask 兼容
sw_vers -productVersion 2>/dev/null         # macOS 版本
for c in brew winget scoop choco apt nvm fnm node npm pnpm go cargo rustup; do
  printf '%-10s ' "$c"; command -v $c >/dev/null 2>&1 && echo OK || echo MISSING
done
```

Ask: 平台是什么？包管理器有哪些？node/go/rust 各是什么版本？和 inventory 里的基线差多少？

- **Windows 上还要问**：原生 Windows 还是 WSL 里跑？两者清单完全不同（WSL 用 Linux 分支，GUI 应用装 Windows 侧）
- mac 用 `references/inventory-macos.md`；Windows 用 `inventory-windows.md`；Linux 用 `inventory-linux.md`

## Step 2: 出「待装清单」⛔ BLOCKING

把 inventory 逐项与 Step 1 的探测结果比对，分三列输出：

| 要装 | 已装(跳过) | 不装(带理由) |

**停下来给用户确认**。装几十个包是有副作用的操作，确认前不动手。

- 用户说「只想知道」→ 出完这张表就结束，不装
- 用户说「补一下」→ 只列 `要装` 那一列
- 重型包（>500MB，如 llvm/gcc/miniconda）**单独列出来问**，不混在批量里

## Step 3: 按依赖顺序装

顺序不能乱——后面的依赖前面的：

1. **包管理器**（brew / winget / scoop / apt）
2. **语言版本管理器**（nvm / fnm）→ 装完再装 node 生态
3. **brew formula / 系统包**
4. **npm 全局包** — 注意 `pitfalls.md` §3（npm 11 拦截 postinstall）
5. **go 工具** — 注意 `pitfalls.md` §6（`@latest` 后缀）
6. **rust 工具链** — 注意 `pitfalls.md` §1、§2（cargo 镜像 + `~/.cargo` 重建）
7. **VS Code 扩展**
8. **独立安装的 CLI**（不走包管理器的，如 cc-switch CLI，见 `pitfalls.md` §4）

每装完一类，跑一次 `command -v` 复验，别等全装完才发现某个装错了。

## Step 4: 跑 pitfalls 自检 ⚠️ REQUIRED

Load `references/pitfalls.md`，逐条对照本机检查。至少确认：

- rust：`cargo --version` 能用，且 `~/.cargo/config.toml` 配了镜像
- node：npm 全局包的原生模块能 `require` 进来（不是只有目录）
- shell：`zsh -i -c 'exit 0'`（或 PowerShell）启动**零报错**
- PATH：`.zshrc` / profile 里引用的目录真实存在

## Step 5: 收尾

产出最终对照表：**要装 / 已跳过 / 明确不装 + 理由**。

- 不装项必须带理由（「重型，按需再装」「已弃用」「GUI，按需手动装」），下次才知道为什么
- 未实测的平台（见 inventory 顶部的 `状态`）如实标注，不假装验过
- 装了但没验的，用置信词标出来

## Anti-Patterns

- `brew bundle install` 一把梭整个 Brewfile —— Brewfile 里含明确不装的重型包
- 在 Windows/Linux 上套用 macOS 的 cask 清单
- 装完只跑 `command -v` 就算验过（原生模块、镜像配置、shell 报错都不会因此暴露）
- 把「不装」项的**理由**省掉——下次看到清单会再问一遍
- 顺手改用户既有配置（`.zshrc`、PowerShell profile）里的内容，而不是只追加缺失行

## Pre-Delivery Checklist

- [ ] 平台已探测，读的是对应平台的 inventory
- [ ] 「待装清单」出过且用户确认过（除非用户明说只出清单不装）
- [ ] 重型包单独问过，没混进批量安装
- [ ] 未跑 oh-my-zsh 官方 install.sh
- [ ] 输出无完整 secret（只前缀 + 长度）
- [ ] Step 4 自检已跑，shell 启动零报错
- [ ] 收尾对照表含「不装 + 理由」
- [ ] 未实测平台已如实标注
