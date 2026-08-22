import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const envColumns = Number.parseInt(process.env.COLUMNS ?? "", 10);
const width = Number.isFinite(envColumns) && envColumns > 0 ? envColumns : 120;
process.env.COLUMNS = String(Math.max(1, width - 4));

const claudeDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), ".claude");
const pluginDir = path.join(claudeDir, "plugins", "claude-hud");
const cacheDir = path.join(claudeDir, "plugins", "cache");

function versionParts(value) {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/.exec(value);
  return match ? match.slice(1, 4).map(Number) : null;
}

function compareVersions(a, b) {
  for (let i = 0; i < 3; i += 1) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}

function readUsdCny() {
  const env = Number.parseFloat(process.env.CLAUDE_HUD_USD_CNY ?? "");
  if (Number.isFinite(env) && env > 0) return env;
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(pluginDir, "hud-local.json"), "utf8"));
    const rate = Number.parseFloat(cfg.usdCny);
    if (Number.isFinite(rate) && rate > 0) return rate;
  } catch {
    /* default */
  }
  return 7.2;
}

function rewriteCny(text, rate) {
  return text.replace(/\$(\d+\.\d{2,4})\b/g, (_, raw) => {
    const usd = Number.parseFloat(raw);
    if (!Number.isFinite(usd)) return _;
    const cny = usd * rate;
    const digits = cny >= 1 ? 2 : 3;
    return `¥${cny.toFixed(digits)}`;
  });
}

function fmtCny(cny) {
  const digits = cny >= 1 ? 2 : 3;
  return `¥${cny.toFixed(digits)}`;
}

function readOfficialCost() {
  const script = path.join(pluginDir, "usage", "session-cost.cjs");
  if (!fs.existsSync(script)) return null;
  const result = spawnSync(process.argv[0], [script], {
    encoding: "utf8",
    timeout: 1500,
    windowsHide: true,
    env: process.env,
    cwd: process.cwd(),
  });
  const raw = (result.stdout || "").trim();
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    if (typeof data.cny === "number" && Number.isFinite(data.cny)) return data;
  } catch {
    /* ignore */
  }
  return null;
}

function applyCost(text) {
  const official = readOfficialCost();
  if (official) {
    const label = fmtCny(official.cny);
    if (/\$\d+\.\d{2,4}\b/.test(text)) {
      return text.replace(/\$(\d+\.\d{2,4})\b/g, label);
    }
    return `${text.replace(/\s*$/, "")}  官网 ${label}`;
  }
  return rewriteCny(text, readUsdCny());
}

function appendUsage() {
  const script = path.join(pluginDir, "usage", "index.cjs");
  if (!fs.existsSync(script)) return;
  const result = spawnSync(process.argv[0], [script], {
    encoding: "utf8",
    timeout: 2500,
    windowsHide: true,
    env: process.env,
  });
  const line = (result.stdout || "").trim();
  if (line) process.stdout.write(`\n${line}`);
}

const candidates = [];
try {
  for (const marketplace of fs.readdirSync(cacheDir, { withFileTypes: true })) {
    if (!marketplace.isDirectory()) continue;
    const pluginRoot = path.join(cacheDir, marketplace.name, "claude-hud");
    let versions = [];
    try {
      versions = fs.readdirSync(pluginRoot, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const version of versions) {
      if (!version.isDirectory()) continue;
      const parts = versionParts(version.name);
      if (!parts) continue;
      const dir = path.join(pluginRoot, version.name);
      if (fs.existsSync(path.join(dir, "dist", "index.js"))) {
        candidates.push({ dir, parts });
      }
    }
  }
} catch {
  process.exit(0);
}

candidates.sort((a, b) => compareVersions(a.parts, b.parts));
const latest = candidates.at(-1);
if (!latest) process.exit(0);

process.env.CLAUDE_HUD_ALLOW_EXTRA_CMD = "1";
process.argv.push(
  "--extra-cmd",
  `"${process.argv[0]}" "${path.join(pluginDir, "cache-stats.cjs")}"`,
);

const chunks = [];
const originalWrite = process.stdout.write.bind(process.stdout);
process.stdout.write = (chunk, encoding, cb) => {
  chunks.push(typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8"));
  if (typeof encoding === "function") encoding();
  if (typeof cb === "function") cb();
  return true;
};

const hud = await import(pathToFileURL(path.join(latest.dir, "dist", "index.js")).href);
if (typeof hud.main === "function") {
  await hud.main();
}

process.stdout.write = originalWrite;
originalWrite(applyCost(chunks.join("")));
appendUsage();
