#!/usr/bin/env node
/**
 * 当前会话 token × DeepSeek 官网价 → JSON { cny, family, source }。
 * 用途：Coding Plan 对照「若走官网按量」会花多少，不是套餐账单。
 * 对不上价表则退出 0 且无输出。
 */
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { resolveFamily, priceUsage, source } = require("./pricing/deepseek.cjs");

const SEEN_CAP = 10_000;

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

function pickTranscript() {
  const fromEnv = process.env.CLAUDE_TRANSCRIPT_PATH;
  if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;
  const fromArg = process.argv[2];
  if (fromArg && fs.existsSync(fromArg)) return fromArg;
  const dir = projectDir(process.cwd());
  if (!fs.existsSync(dir)) return null;
  return newestTranscript(dir);
}

function usageOf(u) {
  const nested = u.cache_creation
    ? (u.cache_creation.ephemeral_5m_input_tokens || 0) +
      (u.cache_creation.ephemeral_1h_input_tokens || 0)
    : 0;
  return {
    input: u.input_tokens || 0,
    cacheRead: u.cache_read_input_tokens || 0,
    cacheWrite: u.cache_creation_input_tokens || nested,
    output: u.output_tokens || 0,
  };
}

function fail() {
  process.exit(0);
}

try {
  const file = pickTranscript();
  if (!file) fail();

  const seen = new Set();
  let lastUsageKey = "";
  let cny = 0;
  let msgs = 0;
  let family = "";
  const tokens = { input: 0, cacheRead: 0, cacheWrite: 0, output: 0 };

  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    if (!line.includes('"usage"')) continue;
    let rec;
    try {
      rec = JSON.parse(line);
    } catch {
      continue;
    }
    if (rec.isSidechain) continue;
    if (rec.type && rec.type !== "assistant") continue;
    const model = rec.message && rec.message.model;
    if (!model || model === "<synthetic>") continue;
    const rowFamily = resolveFamily(model);
    if (!rowFamily) continue;
    const u = rec.message.usage;
    if (!u) continue;

    const id = rec.message.id;
    if (id) {
      if (seen.has(id)) continue;
      if (seen.size < SEEN_CAP) seen.add(id);
    } else {
      const usageKey = [
        u.input_tokens,
        u.output_tokens,
        u.cache_creation_input_tokens,
        u.cache_read_input_tokens,
      ].join("|");
      if (usageKey === lastUsageKey) continue;
      lastUsageKey = usageKey;
    }

    const usage = usageOf(u);
    cny += priceUsage(rowFamily, usage, rec.timestamp);
    tokens.input += usage.input;
    tokens.cacheRead += usage.cacheRead;
    tokens.cacheWrite += usage.cacheWrite;
    tokens.output += usage.output;
    family = rowFamily;
    msgs += 1;
  }
  if (msgs === 0) fail();

  process.stdout.write(
    JSON.stringify({
      cny,
      family,
      source,
      tokens,
    }),
  );
} catch {
  fail();
}
