#!/usr/bin/env node
/**
 * 用当前会话 transcript token × 官网价，输出 JSON { cny, family, source }。
 * 对不上价表则退出 0 且无输出。
 */
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { resolveFamily, priceUsage, source } = require("./pricing/deepseek.cjs");

function claudeDir() {
  return process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), ".claude");
}

function projectDir(cwd) {
  const slug = cwd.replace(/[^a-zA-Z0-9]/g, "-");
  return path.join(claudeDir(), "projects", slug);
}

function newestTranscript(dir) {
  let best = null;
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith(".jsonl")) continue;
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (!best || st.mtimeMs > best.mtimeMs) best = { full, mtimeMs: st.mtimeMs };
  }
  return best && best.full;
}

function readModel() {
  if (process.env.ANTHROPIC_MODEL) return process.env.ANTHROPIC_MODEL;
  try {
    const settings = JSON.parse(fs.readFileSync(path.join(claudeDir(), "settings.json"), "utf8"));
    return settings.env?.ANTHROPIC_MODEL || settings.model || "";
  } catch {
    return "";
  }
}

function fail() {
  process.exit(0);
}

try {
  const family = resolveFamily(readModel());
  if (!family) fail();

  const dir = projectDir(process.cwd());
  const file = newestTranscript(dir);
  if (!file) fail();

  let cny = 0;
  let msgs = 0;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    if (!line.includes('"usage"')) continue;
    let rec;
    try {
      rec = JSON.parse(line);
    } catch {
      continue;
    }
    if (rec.isSidechain) continue;
    const u = rec.message && rec.message.usage;
    if (!u) continue;
    const nested = u.cache_creation
      ? (u.cache_creation.ephemeral_5m_input_tokens || 0) +
        (u.cache_creation.ephemeral_1h_input_tokens || 0)
      : 0;
    cny += priceUsage(
      family,
      {
        input: u.input_tokens || 0,
        cacheRead: u.cache_read_input_tokens || 0,
        cacheWrite: u.cache_creation_input_tokens || nested,
        output: u.output_tokens || 0,
      },
      rec.timestamp,
    );
    msgs += 1;
  }
  if (msgs === 0) fail();

  process.stdout.write(
    JSON.stringify({
      cny,
      family,
      source,
    }),
  );
} catch {
  fail();
}
