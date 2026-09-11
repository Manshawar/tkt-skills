# Windows 环境清单

**状态：⚠️ 未实测** —— 本文是**能力对照**，不是在 Windows 上真装过的记录。

**因此本文不硬编码包 ID**。Windows 的 winget 包 ID（形如 `Golang.Go`）多变且拼写敏感，猜错了会装成别的东西或直接失败。**每个包装前必须 `winget search` 验证 ID 存在且是你要的那个**。

在 Windows 上真跑通一遍后，把本文降级为实测版、写上真实 ID。

---

## 先确认一件事：原生 Windows 还是 WSL？

**这一问决定走哪个分支，先问清楚再动手。**

| | 原生 Windows | WSL2 (Ubuntu) |
| --- | --- | --- |
| 清单 | 本文 | [`inventory-linux.md`](inventory-linux.md) |
| shell | PowerShell + `$PROFILE` | zsh + oh-my-zsh（照 Linux 那套） |
| 包管理器 | winget / scoop / choco | apt |
| Node 版本管理 | `nvm-windows`（与 Unix 的 nvm **不是同一个项目**）或 fnm | nvm |
| 命令行工具（gh/go/rust/npm） | 两套都要装一份 | 装 WSL 侧，Windows 侧不用 |

**混合场景**（推荐做法）：WSL 做开发主力 + Windows 侧装 GUI。此时工具链按 Linux 清单装进 WSL，Windows 侧只装 GUI 应用。不要两边各装一套命令行工具（PATH 会打架）。

---

## 能力对照

格式：**要的能力 → 在 Windows 上怎么找**。`搜索命令` 是给你在目标机上跑的原型，不是可直接照抄的固定答案。

### 包管理器

```powershell
winget --version          # Win10 1809+ / Win11 自带
scoop --version           # 没有的话：https://scoop.sh
choco --version           # 可选
```

### 命令行工具

| 能力 | macOS 对应 | Windows 找法 |
| --- | --- | --- |
| Homebrew 等价 | brew | winget / scoop |
| git | `brew install git` | `winget search Git` |
| GitHub CLI | `gh` | `winget search GitHub.cli` |
| Go | `go` | `winget search Go` |
| Rust | `rustup` | `winget search rustup` —— 或用官方 `rustup-init.exe` |
| Node 版本管理 | nvm / fnm | `winget search nvm` / `fnm`。⚠️ nvm-windows 是另一个项目，命令有差异 |
| 终端复用 | tmux | Windows 无原生等价；WSL 里有，或按需要挑 |
| 目录跳转 | autojump | `winget search autojump`，或 PowerShell 的 `zoxide` 替代 |
| 7z / pandoc / poppler | p7zip / pandoc / poppler | 逐个 `winget search <名字>` |
| make | `make` | 原生无，装 `ezwinports` 的 make 或走 WSL |
| adb / fastboot | `android-platform-tools` | `winget search adb` |

### 语言生态（命令与平台无关，直接照搬 macOS 清单）

```powershell
# npm 全局包 —— 与 macOS 完全相同的包名
npm install -g typescript typescript-language-server ts-node tsx serve asar `
  agent-browser openskills chrome-devtools-mcp mcp-chrome-bridge nrm `
  @openai/codex @musistudio/claude-code-router @manshawar/tkt `
  @deepseek-ai/dsh @gsd-build/sdk

# go 工具 —— 同样的 @latest 规则（见 pitfalls.md §6）
go install golang.org/x/tools/gopls@latest

# VS Code 扩展 —— 同一个清单文件
# references/vscode-extensions.txt 里的 ID 在 Windows 上通用，
# 把文件名里的 macos 忽略即可（扩展本身不分平台，个别 lldb 类除外）
```

⚠️ **npm 11 的 `--allow-scripts` 问题在 Windows 上同样存在** —— 见 `pitfalls.md` §3。

### rust

Windows 上**用官方 `rustup-init.exe`**，不用 brew 那套（也就没有 `pitfalls.md` §2 的 `~/.cargo` 重建问题）：

- `%USERPROFILE%\.cargo` 和 `%USERPROFILE%\.rustup` 由官方安装器创建
- `~/.cargo/config.toml` 镜像配置**路径结构相同**（Windows 上是 `%USERPROFILE%\.cargo\config.toml`），`pitfalls.md` §1 的镜像内容照搬

### cc-switch CLI

有 Windows 构建。从 `SaladDay/cc-switch-cli` 的 releases 下 `cc-switch-cli-windows-x64.zip`
（来源确认方式见 `pitfalls.md` §4 —— **认准 SaladDay，别装同名第三方仓库**）。

### GUI 应用

macOS 的 cask 列表在这里要逐个映射成 winget 包。**注意 macOS 专有应用在 Windows 上不存在**（iTerm2 没有 Windows 版；Obsidian / Typora / DBeaver / Apifox 有）。

清单见 `inventory-macos.md` 的「不装」表 —— 那批 GUI 应用在 Windows 上同样按需手动装，不自动装。

---

## PowerShell profile

等价于 `.zshrc` / `.zshenv`。路径：

```powershell
$PROFILE.CurrentUserAllHosts     # ~\Documents\PowerShell\profile.ps1
Test-Path $PROFILE               # 不存在就 New-Item -Path $PROFILE -Force
```

要恢复的东西（对照 `inventory-macos.md` 的「shell 配置结构」表，语义等价）：

| macOS 里 | PowerShell 里 |
| --- | --- |
| `export PATH="$HOME/.local/bin:$PATH"` | `$env:Path = "$env:USERPROFILE\.local\bin;$env:Path"` |
| `. "$HOME/.cargo/env"` | `$env:Path = "$env:USERPROFILE\.cargo\bin;$env:Path"` |
| npm 全局 bin 在 PATH | npm 全局 bin 通常自动在 PATH，验证 `Get-Command tsc` |
| `GITHUB_TOKEN` 等 secret | **不在本文记录**，用户自己设（`[Environment]::SetEnvironmentVariable`） |

⚠️ **不要自动改用户已有 profile** —— 只追加缺失行，且追加前先 `Test-Path` 判断该目录/命令是否真缺。

---

## 验证

```powershell
# shell 启动零报错
powershell -NoProfile -Command "exit 0"
pwsh -NoProfile -Command "exit 0"        # 若装了 PowerShell 7

# 命令在位
foreach ($c in 'git','gh','go','cargo','rustc','node','npm','cc-switch') {
  "{0,-12} {1}" -f $c, $(if (Get-Command $c -ErrorAction SilentlyContinue) { 'OK' } else { 'MISSING' })
}

# 原生模块能真加载（对应 pitfalls.md §3）
$g = npm root -g
node -e "require('$g/@musistudio/claude-code-router/node_modules/better-sqlite3'); console.log('OK')"
```
