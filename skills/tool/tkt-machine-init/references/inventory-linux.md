# Linux 环境清单

**状态：⚠️ 未实测** —— 本文是**能力对照**，不是在 Linux 上真装过的记录。

与 macOS 的差距比 Windows 小得多：shell 配置、npm/go/rust 生态基本照搬。主要差异在**包管理器**和**服务管理**两块。在 Linux 上真跑通后，把本文降级为实测版。

---

## 先确认发行版

```bash
cat /etc/os-release          # ID / VERSION_ID
command -v apt dnf pacman zypper brew
```

| 发行版系 | 包管理器 | 说明 |
| --- | --- | --- |
| Debian / Ubuntu | `apt` | 用户量大，包里最全 |
| Fedora / RHEL | `dnf` | |
| Arch | `pacman` | |
| 任意 | **Linuxbrew** | 与 macOS brew 同源，包名/用法**几乎照搬 macOS 清单** —— 想省事就走这条 |

如果**用了 Linuxbrew**，那 `inventory-macos.md` 的 brew formula 清单可以基本原样用（去掉 mac 专有的 `mas`、`makensis` 之类）。代价是 Linuxbrew 装 GUI 能力弱。

---

## 能力对照

### 命令行工具

| 能力 | macOS 对应 | Linux 找法 |
| --- | --- | --- |
| git | `brew install git` | `apt install git` / 通常预装 |
| GitHub CLI | `gh` | 发行版源里多半有；没有走官方 apt repo |
| Go | `go` | `apt install golang-go`（**版本常偏旧**，建议官方 tarball） |
| Rust | `rustup` | **官方 `curl https://sh.rustup.rs \| sh`** —— 见下方说明 |
| Node 版本管理 | nvm / fnm | `nvm` 官方脚本，或 `fnm`（有 Linux 构建） |
| tmux | tmux | `apt install tmux` |
| nginx | nginx | `apt install nginx` |
| pandoc / poppler / 7z / librsvg | 同名 | `apt install pandoc poppler-utils p7zip-full librsvg2-bin` |
| make / gcc | make / gcc | `apt install build-essential`（**Linux 上 gcc 是基础包，不像 macOS 那样是 1.5G 重型包**） |
| adb / fastboot | android-platform-tools | `apt install adb fastboot` |

### 语言生态（与平台无关，照搬）

```bash
# npm 全局包 —— 包名完全相同（注意 pitfalls.md §3 的 --allow-scripts）
# go 工具 —— 同样的 @latest 规则（pitfalls.md §6）
# VS Code 扩展 —— 用 references/vscode-extensions.txt 里的 ID
```

### rust —— 与 macOS 有一处关键差异

Linux 上**用官方 rustup 安装器**，`~/.cargo` 和 `~/.rustup` 由它创建：

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

→ **因此没有 `pitfalls.md` §2 的「`~/.cargo` 重建」问题**（那个坑是 brew 版 rustup 特有的）。

但 **`pitfalls.md` §1 的 crates 镜像照配**，路径同为 `~/.cargo/config.toml`。

### cc-switch CLI

有 Linux 构建（`SaladDay/cc-switch-cli` 的 releases）。同一份 `install.sh` 会自动挑资产：

- 默认（`CC_SWITCH_LINUX_LIBC=auto`）用 **musl 静态版**，**不会回退到 glibc**
- 需要 glibc 版显式指定：`CC_SWITCH_LINUX_LIBC=glibc`
- 装到 `~/.local/bin`

来源确认方式见 `pitfalls.md` §4 —— **认准 SaladDay**。

### GUI 应用

macOS 的 cask 在这里映射成发行版包 / Flatpak / AppImage / Snap。macOS 专有应用在 Linux 上不存在（**iTerm2 没有 Linux 版**；Obsidian / Typora / DBeaver 有）。

同 macOS 清单的约定：GUI 按需手动装，不自动装。

---

## shell 配置

`.zshrc` / `.zshenv` / `.zprofile` 的**结构照搬** `inventory-macos.md` 的「shell 配置结构」表，注意：

- **`pitfalls.md` §7 同样适用** —— oh-my-zsh 只 clone，别跑官方 `install.sh`
- `pitfalls.md` §8 的 PATH 死链同样要建（`~/.local/bin`、`~/Library/pnpm` → Linux 上 pnpm home 是 `~/.local/share/pnpm`，**路径不同**，看 `PNPM_HOME` 实际值）
- `HOMEBREW_*` 那几行只在用 Linuxbrew 时才有意义

---

## 服务管理：launchd → systemd

macOS 的 launchd 在 Linux 上是 **systemd**。本次初始化**不含**任何需要常驻的服务项（CCR 已废弃），但如果目标机要跑常驻服务：

| macOS | Linux |
| --- | --- |
| `~/Library/LaunchAgents/*.plist` | `~/.config/systemd/user/*.service` |
| `launchctl bootstrap gui/$(id -u) <plist>` | `systemctl --user daemon-reload && systemctl --user enable --now <svc>` |
| `launchctl print gui/$(id -u)/<label>` | `systemctl --user status <svc>` |
| `launchctl bootout gui/$(id -u)/<label>` | `systemctl --user disable --now <svc>` |

---

## 验证

```bash
zsh -i -c 'exit 0'                      # 零报错
for c in cargo rustc go gh tmux node npm cc-switch; do
  printf '%-12s ' "$c"; command -v $c >/dev/null && echo OK || echo MISSING
done

# 原生模块能真加载（对应 pitfalls.md §3）
G=$(npm root -g)
node -e "require('$G/@musistudio/claude-code-router/node_modules/better-sqlite3'); console.log('OK')"
```
