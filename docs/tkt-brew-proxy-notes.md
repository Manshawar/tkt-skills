# Homebrew 走代理 / 网络排障笔记

> 2026-08-25 实战沉淀。症状：`brew update` 卡在 `Updating Homebrew...` 半天，最终根因是清华镜像 fetch 停滞 + 代理端口用错 + 挂死进程占锁三层叠加。

## 排障守则

- **先找证据再动配置**：brew 网络问题九成不是「没代理」。先跑排查链定位，再决定改什么。乱配全局代理会伤内网仓库。
- **绝不给内网仓库用户配全局 git 代理**——公司 GitLab 走梯子必卡。要么只对 `github.com` 配，要么临时 export。
- **连接层通 ≠ 传输通**：curl / `ls-remote` 秒回但 `git fetch` 卡，是镜像传输停滞，换源或走代理，别反复试连接。
- **改 remote 前记原值**：先 `git -C /opt/homebrew remote get-url origin` 存一份，方便回滚。

## 排查链（按顺序）

### 1. 确认代理端口真值

Clash Verge GUI 里的「HTTP 端口」（`verge_port`）**可能根本没监听**，真实端口以系统代理为准：

```bash
scutil --proxy        # macOS 系统代理真值：HTTP/HTTPS/SOCKS 端口
nc -z -w 2 127.0.0.1 7897 && echo 可达 || echo 不可达
pgrep -fl -i 'clash|verge'   # clash 核心在跑吗
```

案例：GUI 显示 HTTP 端口 7899，实际 mihomo 只监听混合端口 7897 → `http_proxy=7899` 必然 `Couldn't connect to server`。Clash Verge Rev 默认 `verge_mixed_port` 才是实际代理端口。

### 2. 测 git 与 curl 连通

```bash
# curl 走代理
curl -x http://127.0.0.1:7897 -sI -m 10 https://github.com -o /dev/null -w '%{http_code}\n'
# git 走代理（git/libcurl 认 https_proxy 环境变量，也认 -c http.proxy）
git ls-remote https://github.com/Homebrew/brew.git HEAD
# git 低速中止：5s 无数据传输即失败，用于区分「连不上」和「传输卡」
git -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=5 ls-remote <url> HEAD
```

### 3. 挂死进程占锁

```bash
ps -eo pid,etime,stat,command | grep -E 'brew update|git fetch|git-remote' | grep -v grep
ls -la /opt/homebrew/var/homebrew/locks/update
kill <pid>   # 杀掉挂死的 brew update 释放锁
```

症状：`Error: Another brew update process is already running.` → 上一个 `brew update` 还活着占着锁。

### 4. 看 remote 与镜像配置

```bash
git -C /opt/homebrew remote -v
for t in /opt/homebrew/Library/Taps/*/*; do [ -d "$t/.git" ] && echo "$t -> $(git -C "$t" remote get-url origin)"; done
env | grep -i '^HOMEBREW'   # HOMEBREW_API_DOMAIN / HOMEBREW_BOTTLE_DOMAIN
```

## 常见场景与处置

### A. 卡在 `Updating Homebrew...` 半天

按排查链走。三种典型根因：
1. **代理端口错**（连 127.0.0.1 被拒）→ 用 `scutil --proxy` 取真值
2. **镜像 fetch 停滞**（curl 通、ls-remote 通、fetch 卡）→ 切回官方 GitHub + 代理
3. **挂死进程占锁** → 杀进程释放锁

### B. 清华/阿里镜像 fetch 卡死

现象：直连 curl 200、`ls-remote` 秒回，但 `brew update` 卡在 `git-remote-https ... tuna/aliyun...`。
处置：镜像传输大仓库可能停滞，切回官方源走代理：

```bash
git -C /opt/homebrew remote set-url origin https://github.com/Homebrew/brew.git
export https_proxy=http://127.0.0.1:7897 http_proxy=http://127.0.0.1:7897
brew update
```

### C. 内网仓库用户配代理

不要全局代理，只对 `github.com` 走梯子：

```bash
git config --global http.https://github.com/.proxy http://127.0.0.1:7897
```

其他域名（GitLab / 内网）自动直连。验证与还原：

```bash
git config --global --get-regexp 'http.*\.proxy'
git config --global --unset-all http.https://github.com/.proxy   # 还原直连
```

### D. 关掉 brew 自动更新（治本防卡）

```bash
echo 'export HOMEBREW_NO_AUTO_UPDATE=1' >> ~/.zshrc
```

### E. 临时一次走代理

```bash
export https_proxy=http://127.0.0.1:7897 http_proxy=http://127.0.0.1:7897
brew update
```

## 取舍速查

| 方案 | 命令 | 适用 |
| --- | --- | --- |
| 临时 export | 每次终端手动 | 偶尔用代理 |
| git 全局代理 | `git config --global http.proxy ...` | 全是 GitHub 项目、无内网 |
| 仅 github.com 代理 | `git config --global http.https://github.com/.proxy ...` | **有内网/公司仓库（推荐）** |
