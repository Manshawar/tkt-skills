# macOS 环境清单

**状态：实测** —— 2026-09-11 在 Apple Silicon (arm64) / macOS 26.6.2 上逐个装过并复验。

**来源**：`/Volumes/other/appconfig/inventory/Brewfile`（重装前的完整导出）+ 本次补装实测的增删。

**目录**：[基线](#基线) · [要装](#要装) · [不装](#不装) · [shell 配置](#shell-配置结构) · [验证](#验证)

---

## 基线

| 项 | 值 |
| --- | --- |
| 平台 | macOS Darwin，arm64 |
| 包管理器 | Homebrew，前缀 `/opt/homebrew`（Intel 是 `/usr/local`） |
| Node 版本管理 | **nvm**（brew 装），不是 fnm —— 见下方说明 |
| 镜像 | `HOMEBREW_BOTTLE_DOMAIN` 走阿里云；`RUSTUP_DIST_SERVER` 走 rsproxy；npm 走 `registry.npmjs.org` |

⚠️ **nvm vs fnm**：Brewfile 里有 `fnm`，但实际 `.zshrc` 用的是 **nvm**（`NVM_DIR` + `nvm.sh`）。两者都在清单里，选一个即可，**默认跟着 `.zshrc` 走 nvm**。

---

## 要装

按依赖顺序。命令为参考写法，Mac 上逐条 `command -v` 复验过。

### 1. Homebrew

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
eval "$(/opt/homebrew/bin/brew shellenv)"     # Intel 改 /usr/local
```

### 2. brew formula（19 个）

```bash
brew install autojump cliproxyapi delve fnm gh git go librsvg make makensis mas nginx nvm p7zip pandoc poppler python@3.13 rustup tmux uv zsh
```

| 包 | 干什么 |
| --- | --- |
| `git` | 系统自带 Apple git 2.54，brew 版可换新 |
| `zsh` | 系统 zsh 之外装新版 |
| `nvm` | Node 版本管理（**.zshrc 实际用这个**） |
| `fnm` | Node 版本管理备选（Brewfile 里也有，二选一） |
| `go` | Go 工具链 |
| `rustup` | Rust 工具链管理器（**装完还要单独初始化，见 §rust**） |
| `python@3.13` / `uv` | Python 与包管理器 |
| `gh` | GitHub CLI |
| `tmux` | 终端复用 |
| `nginx` | 本地反向代理 |
| `pandoc` / `poppler` / `p7zip` / `librsvg` | 文档与格式转换 |
| `make` | 构建 |
| `mas` | Mac App Store CLI |
| `makensis` | Windows 安装包构建 |
| `delve` | Go 调试器 |
| `autojump` | 目录跳转 |
| `cliproxyapi` | 把各家 AI CLI 包成 API 服务 |

### 3. brew cask

```bash
brew install --cask android-platform-tools   # adb / fastboot
```

其余 cask 见 [不装](#不装)。

### 4. npm 全局包

```bash
npm install -g typescript typescript-language-server ts-node tsx serve asar \
  agent-browser openskills chrome-devtools-mcp mcp-chrome-bridge nrm \
  @openai/codex @musistudio/claude-code-router @manshawar/tkt \
  @deepseek-ai/dsh @gsd-build/sdk
```

⚠️ **必须带 `--allow-scripts=`**，否则原生模块静默不编译 → `pitfalls.md` §3。

公司私有包（走 `registry.npm.qianxin-inc.cn`）：

```bash
npm install -g @lanxin/yf-vue3-cli --registry=https://registry.npm.qianxin-inc.cn/
```

`pnpm` 若已有 corepack shim，直接 `pnpm --version` 验证，**不要**再 `npm i -g pnpm`（EEXIST）。

### 5. go 工具（13 个）

```bash
go install <pkg>@latest     # Go 1.27 必须带 @latest，见 pitfalls.md §6
```

`gopls` · `goimports` · `dlv` · `go-outline` · `godef` · `golangci-lint` · `gomodifytags` · `gopkgs` · `goplay` · `goreturns` · `gotests` · `impl` · `staticcheck`

落到 `~/go/bin`。**注意**：`.zshrc` 里没把 `~/go/bin` 加进 PATH（原机也没加），VS Code Go 扩展会自己找。

### 6. rust

```bash
brew install rustup
rustup toolchain install stable && rustup default stable
# 然后重建 ~/.cargo —— pitfalls.md §2
cargo install cargo-xwin
```

### 7. VS Code 扩展（71 个）

`code --install-extension <id>` 逐条装。列表见
[`vscode-extensions.txt`](vscode-extensions.txt)。

### 8. 独立安装的 CLI（不走包管理器）

**cc-switch CLI** —— 来源是 `SaladDay/cc-switch-cli`，**不是** Brewfile 里那个 cask。见 `pitfalls.md` §4。

---

## 不装

每一项都必须带理由，否则下次会重新纠结一遍。

| 不装 | 理由 |
| --- | --- |
| `llvm` (~2G) | 重型，只在编译原生模块时才用得上，按需再装 |
| `gcc` (~1.5G) | 同上；macOS 有 clang，多数场景够用 |
| `miniconda` (~500M) | 重型；`.zshrc` 有 conda initialize 块会静默失败，但**不影响使用**（`__conda_setup` 有 fallback） |
| `cursor` cask | 已弃用 |
| `iterm2` cask | GUI，按需手动装 |
| `antigravity-tools` cask | GUI，按需手动装 |
| `cc-switch` cask | GUI；且若 `/Applications/CC Switch.app` 已存在，brew 会拒绝覆盖报 `already an App` —— 直接用独立 CLI 即可 |
| CCR (`@musistudio/claude-code-router` 的服务器部分) | **已废弃**，不再起 launchd 保活 3456 |
| `rtk` (cargo) | 不用 |
| `clash-verge-rev` | 已单独装（GUI） |
| GUI 应用：Apifox / DBeaver / Obsidian / Typora / Lark / Docker / GitHub Desktop / RDM 等 | 不在「工具链」范围，按需手动装 |

---

## shell 配置（结构）

**只记结构，不记值**。恢复时缺什么补什么，secret 由用户自己填。

| 文件 | 关键行 | 备注 |
| --- | --- | --- |
| `~/.zshenv` | `. "$HOME/.cargo/env"` + `GITHUB_TOKEN` | cargo 那行**必须在**，否则开 shell 报错 |
| `~/.zprofile` | brew shellenv + `HOMEBREW_*` 镜像变量 | |
| `~/.zshrc` | `ZSH=$HOME/.oh-my-zsh` → `source $ZSH/oh-my-zsh.sh` → `plugins=(git)` | oh-my-zsh 用 clone 装，**别跑官方脚本** |
| `~/.zshrc` | nvm 初始化（PATH 配置放最后） | |
| `~/.zshrc` | `PNPM_HOME="$HOME/Library/pnpm"`、`PATH=$HOME/.local/bin:$PATH` | 这两个目录**要手动建**，否则 PATH 里是死链 |
| `~/.zshrc` | cc-switch completions 块（`site-functions` + `compinit`） | `cc-switch completions install --activate` 会自己写 |
| `~/.cargo/config.toml` | rsproxy 镜像 | **必配**，见 `pitfalls.md` §1 |
| `~/.cargo/env` | 把 `$HOME/.cargo/bin` 加进 PATH | rustup 官方会写，brew rustup 不会 → 手写 |

---

## 验证

装完跑：

```bash
zsh -i -c 'exit 0'                                  # 必须零报错
for c in cargo rustc go gh tmux nginx pandoc cc-switch tkt agent-browser codex; do
  printf '%-14s ' $c; command -v $c >/dev/null && echo OK || echo MISSING
done
cargo --version && rustc --version && go version
```

原生模块（不是只有目录，要能 `require` 进来）：

```bash
G=$(npm root -g)
node -e "require('$G/@musistudio/claude-code-router/node_modules/better-sqlite3'); console.log('better-sqlite3 OK')"
```
