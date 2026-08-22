const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

function cacheDir() {
  const claudeDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), ".claude");
  return path.join(claudeDir, "plugins", "claude-hud", "usage-cache");
}

function ttlSec() {
  const env = Number.parseInt(process.env.CLAUDE_HUD_USAGE_TTL_SEC ?? "", 10);
  if (Number.isFinite(env) && env > 0) return env;
  try {
    const cfg = JSON.parse(
      fs.readFileSync(path.join(path.dirname(cacheDir()), "hud-local.json"), "utf8"),
    );
    const n = Number.parseInt(cfg.usageTtlSec, 10);
    if (Number.isFinite(n) && n > 0) return n;
  } catch {
    /* default */
  }
  return 60;
}

function cachePath(id) {
  return path.join(cacheDir(), `${id}.json`);
}

function readFresh(id) {
  try {
    const raw = JSON.parse(fs.readFileSync(cachePath(id), "utf8"));
    if (Date.now() - raw.ts < ttlSec() * 1000 && typeof raw.line === "string") {
      return raw.line;
    }
  } catch {
    /* miss */
  }
  return null;
}

function write(id, line) {
  fs.mkdirSync(cacheDir(), { recursive: true });
  fs.writeFileSync(cachePath(id), JSON.stringify({ ts: Date.now(), line }), "utf8");
}

function cached(id, fetchLine) {
  const hit = readFresh(id);
  if (hit !== null) return hit;
  const line = fetchLine();
  if (typeof line === "string" && line) write(id, line);
  return line;
}

module.exports = { cached, readFresh, write, ttlSec };
