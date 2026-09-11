# 环境初始化踩坑集

都是实测踩出来的，按「症状 → 根因 → 处置」写。每条都对应一次真实的失败。

**目录**：[rust](#1-cargo-卡死但网络正常) · [~/.cargo 丢失](#2-cargo-目录不在备份里) · [npm postinstall](#3-npm-11-静默不编译原生模块) · [cc-switch CLI](#4-cc-switch-cli-来源不明) · [私有包 404](#5-私有-npm-包报-404) · [go install](#6-go-install-报-无法安装) · [oh-my-zsh](#7-oh-my-zsh-官方脚本覆盖-zshrc) · [PATH 死链](#8-path-里引用了不存在的目录) · [brew cask 冲突](#9-brew-cask-拒绝安装已存在的-app)

---

## 1. cargo 卡死但网络正常

**症状**：`cargo install <包>` 挂住不动。`ps` 看进程还活着，但 **8 分钟只消耗 1.5s CPU**，输出文件 0 字节。`curl https://index.crates.io/config.json` 却是 200 且 0.4s 返回。

**根因**：**`.zshrc` 里的 `RUSTUP_DIST_SERVER` 只管 toolchain 下载，不管 crates 索引**。两者是两个独立配置。国内直连 crates.io 稀疏索引要逐个元数据请求，看起来像卡死。

**处置**：写 `~/.cargo/config.toml`：

```toml
[source.crates-io]
replace-with = 'rsproxy-sparse'

[source.rsproxy-sparse]
registry = "sparse+https://rsproxy.cn/index/"

[registries.rsproxy]
index = "https://rsproxy.cn/crates.io-index"

[net]
git-fetch-with-cli = true
```

实测效果：同一个 `cargo install cargo-xwin`，配之前 8 分钟零进展，配之后 **1 分 04 秒**装完。

---

## 2. `~/.cargo` 目录不在备份里

**症状**：`.zshenv` / `.bash_profile` / `.profile` 都 source `~/.cargo/env`，但重装后该文件不存在 → **每次开 shell 静默报错**（不阻塞，所以容易漏掉）。

**根因**：home 目录备份是**选择性**的（只挑了 .vscode/.claude-code-router 那几个），`~/.cargo` 不在其中。而 brew 的 rustup 又不会创建它——brew 版只在 caveat 里说「把 `$(brew --prefix rustup)/bin` 加进 PATH」。

**处置**：手工重建，效果等同 rustup 官方布局，且 `cargo install` 的产物也有地方落：

```bash
mkdir -p ~/.cargo/bin
for f in /opt/homebrew/opt/rustup/bin/*; do ln -sf "$f" ~/.cargo/bin/; done
cat > ~/.cargo/env <<'EOF'
case ":${PATH}:" in
    *:"$HOME/.cargo/bin":*) ;;
    *) export PATH="$HOME/.cargo/bin:$PATH" ;;
esac
EOF
```

**别指望 brew 带 `rustup-init`** —— 该 formula 只装 `rustup` 一个二进制，没有 `rustup-init`。用 `rustup toolchain install stable && rustup default stable` 代替。

---

## 3. npm 11 静默不编译原生模块

**症状**：`npm install -g` 报成功、包也在 `node_modules` 里，但 `require('better-sqlite3')` 之类失败。安装时只有一行不显眼的 `npm warn install-scripts`。

**根因**：**npm 11 默认拦截 install/postinstall 脚本**（供应链安全特性）。`better-sqlite3`（prebuild-install）、`node-pty`、`koffi`、`esbuild` 这些靠脚本下载/编译原生二进制的包会静默变成空壳。

**处置**：带上 `--allow-scripts=` 重跑，npm 会在警告里直接给出该放行的包名列表：

```bash
npm install -g --allow-scripts=agent-browser,mcp-chrome-bridge,better-sqlite3,esbuild,@deepseek-ai/dsh-subprocess-local,koffi,node-pty,@google/genai,protobufjs <包列表...>
```

⚠️ 该 flag **必须和包列表一起给**。只跑 `npm install -g --allow-scripts=...` 会报 `ENOENT: no such file or directory, open '~/package.json'`。

**验证**（必须能真加载，不是只看目录在不在）：

```bash
G=$(npm root -g)
node -e "require('$G/@musistudio/claude-code-router/node_modules/better-sqlite3'); console.log('OK')"
```

---

## 4. cc-switch CLI 来源不明

**症状**：`.zshrc` 里 `alias cc='cc-switch'`、skill 里也用 `cc-switch` 命令，但这命令不在 Brewfile 里，`command -v cc-switch` 找不到。

**根因**：**GUI app 和 CLI 是两个独立安装的东西**：

- `/Applications/CC Switch.app` ← brew cask `cc-switch`（farion1231/cc-switch，GUI）
- `~/.local/bin/cc-switch` ← 独立安装的 CLI（**SaladDay/cc-switch-cli**），版本号体系和 GUI 完全不同

`/Applications/CC Switch.app/Contents/MacOS/cc-switch` 是 **GUI 启动器，不是 CLI** —— 传子命令没有输出。

**为什么必须认准来源**：GitHub 上同名 `cc-switch-cli` 仓库有 4+ 个（SaladDay / Astrenix / bigwhite / OpenCils）。这个 CLI 要读 `~/.cc-switch/cc-switch.db`，**里面是你所有供应商的 API key** —— 装错来源等于把 key 交给陌生仓库。

**处置**（来源确认方式：从自己的 shell 历史里挖，别猜）：

```bash
grep -aiE "cc-switch" ~/.zsh_history | grep -aiE "install|curl"
# 实测命中的原命令：
#   curl -fsSL https://github.com/SaladDay/cc-switch-cli/releases/latest/download/install.sh | bash
#   cc-switch completions install --activate
```

装完是 `~/.local/bin/cc-switch`（v5.10.4）。`completions install --activate` 会往 `.zshrc` 写 completions 块 —— **幂等，但会把块挪到文件末尾**（内容不变）。

---

## 5. 私有 npm 包报 404

**症状**：`npm install -g @byted-aml/ark-helper` → `E404 Not Found`。

**根因**：不一定是包没了，**很可能是源不对**。私有包只在公司 registry 上。

**处置**：先对两个源各查一次再下结论：

```bash
npm view <pkg> version --registry=https://registry.npmjs.org/
npm view <pkg> version --registry=https://registry.npm.qianxin-inc.cn/
```

实测：`@lanxin/yf-vue3-cli` 在 npmjs 404、公司源有 → 加 `--registry=` 装即可。`@byted-aml/ark-helper` **两个源都没有** → 这个是真拿不到，如实报，别硬试。

⚠️ 一次装多个包时，**任何一个 404 会导致整批失败** —— 先单独验私有包，再和公共包一起装。

---

## 6. `go install` 报「无法安装」

**症状**：`go install golang.org/x/tools/gopls` 失败，提示 `Try 'go install ...@latest' to install the latest version`。

**根因**：新版 Go（1.27 实测）要求模块外 `go install` 必须带版本后缀。

**处置**：一律加 `@latest`（Brewfile 里的 `go "..."` 行都不带后缀，照抄会全挂）：

```bash
export GOPROXY=https://goproxy.cn,direct   # 国内加速
go install golang.org/x/tools/gopls@latest
```

---

## 7. oh-my-zsh 官方脚本覆盖 `.zshrc`

**症状**：装完 oh-my-zsh，用户 `.zshrc` 里几百行自定义全没了。

**根因**：官方 `install.sh` 在无 `.zshrc` 时写入模板，**在已有 `.zshrc` 时备份成 `.zshrc.pre-oh-my-zsh` 并覆盖成模板**。

**处置**：**只 clone，不跑脚本**：

```bash
git clone --depth=1 https://github.com/ohmyzsh/ohmyzsh.git ~/.oh-my-zsh
```

前提是 `.zshrc` 里已有 `ZSH="$HOME/.oh-my-zsh"` + `source $ZSH/oh-my-zsh.sh`（重装恢复的配置本来就带）。验证：

```bash
zsh -i -c 'echo "theme=$ZSH_THEME plugins=$plugins"'   # → theme=robbyrussell plugins=git
```

---

## 8. PATH 里引用了不存在的目录

**症状**：shell 启动静默报错，或某个命令时好时坏。

**根因**：恢复的配置引用了重装后不存在的目录。

**处置**：装之前先把这些建出来：

| 配置里的引用 | 谁创建的 |
| --- | --- |
| `$HOME/.local/bin` | 无（很多 CLI 装这儿）→ **手动 mkdir** |
| `$HOME/Library/pnpm`（`PNPM_HOME`） | pnpm → 手动 mkdir |
| `$HOME/.docker/completions`（fpath） | Docker → 没装 Docker 就是死链，无害 |
| `$HOME/.local/share/zsh/site-functions` | `cc-switch completions install` 自己建 |

**验证**：`zsh -i -c 'exit 0'` 必须**零输出**（除了 session 提示）。

---

## 9. brew cask 拒绝安装已存在的 app

**症状**：`brew install --cask cc-switch` → `Error: cc-switch: It seems there is already an App at '/Applications/CC Switch.app'.`

**根因**：cask 不覆盖已存在的 app。

**处置**：分情况——**先确认那个 app 是不是同一个东西**。

- 确实同一个（如手装过 GUI）→ **不用管**，cask 只是没注册，不影响使用，直接装你要的独立 CLI（见 §4）
- 想强行接管 → `brew install --cask --force <cask>`（会覆盖，确认后再做）

别默认用 `--force`。

---

## 附：pnpm 的 EEXIST

`npm install -g pnpm` 报 `EEXIST: file already exists .../bin/pnpm` —— 是 corepack shim 占位。**不要 `--force` 覆盖**，直接 `pnpm --version` 验证能用就行。
