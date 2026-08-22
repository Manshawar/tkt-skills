#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  ccSwitchDbPath,
  commandKind,
  hudLauncherPath,
  hudPluginDir,
  listClaudeProviders,
  openCcSwitchDb,
  previewSecret,
  readCommonConfig,
  readJson,
  settingsPath,
} from "./lib.mjs";

const checks = [];

function add(id, status, detail) {
  checks.push({ id, status, detail });
}

function envPreview(name) {
  const v = process.env[name];
  if (!v) return null;
  return { name, preview: previewSecret(v) };
}

const settingsFile = settingsPath();
let live = null;
if (!fs.existsSync(settingsFile)) {
  add("settings_json", "fail", `missing ${settingsFile}`);
} else {
  live = readJson(settingsFile);
  add("settings_json", "ok", settingsFile);
}

const liveCommand = live?.statusLine?.command || "";
const liveKind = commandKind(liveCommand);
add(
  "live_command",
  liveKind === "hud" ? "ok" : liveKind === "missing" ? "fail" : "warn",
  liveKind === "missing" ? "no statusLine" : `${liveKind}: ${liveCommand}`,
);

const hud = hudLauncherPath();
add(
  "hud_launcher",
  fs.existsSync(hud) ? "ok" : "fail",
  fs.existsSync(hud) ? hud : `missing ${hud} — install claude-hud plugin first`,
);

const launcherText = fs.existsSync(hud) ? fs.readFileSync(hud, "utf8") : "";
add(
  "cny_rewrite",
  launcherText.includes("rewriteCny") ? "ok" : "fail",
  launcherText.includes("rewriteCny")
    ? "statusline.mjs rewrites $ → ¥"
    : "launcher missing rewriteCny — run apply",
);
const usageIndex = path.join(hudPluginDir(), "usage", "index.cjs");
const volc = path.join(hudPluginDir(), "usage", "vendors", "volcengine.cjs");
const sessionCost = path.join(hudPluginDir(), "usage", "session-cost.cjs");
const deepseekPrice = path.join(hudPluginDir(), "usage", "pricing", "deepseek.cjs");
add(
  "usage_overlay",
  fs.existsSync(usageIndex) && fs.existsSync(volc) ? "ok" : "fail",
  fs.existsSync(usageIndex) && fs.existsSync(volc)
    ? usageIndex
    : "missing usage/index.cjs or vendors/volcengine.cjs — run apply",
);
const sessionText = fs.existsSync(sessionCost) ? fs.readFileSync(sessionCost, "utf8") : "";
const volcText = fs.existsSync(volc) ? fs.readFileSync(volc, "utf8") : "";
const priced = fs.existsSync(sessionCost) && fs.existsSync(deepseekPrice);
const deduped = sessionText.includes("seen.has") && sessionText.includes("message.id");
add(
  "official_pricing",
  priced && deduped ? "ok" : "fail",
  !priced
    ? "missing session-cost/pricing — run apply"
    : deduped
      ? "DeepSeek official CNY + message.id dedupe"
      : "session-cost missing message.id dedupe — 官网¥ will inflate 2–3x",
);
add(
  "usage_percent_unit",
  volcText && !/\*\s*100/.test(volcText) ? "ok" : volcText ? "fail" : "fail",
  !volcText
    ? "missing volcengine.cjs — run apply"
    : /\*\s*100/.test(volcText)
      ? "volcengine multiplies percent by 100 — official UI will disagree"
      : "arkcli percent used as-is (already a percentage)",
);

const baseUrl = live?.env?.ANTHROPIC_BASE_URL || process.env.ANTHROPIC_BASE_URL || "";
if (/volces\.com|volcengine|ark\.cn-beijing/i.test(baseUrl)) {
  try {
    execFileSync("arkcli", ["--help"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 2000,
      windowsHide: true,
    });
    add("arkcli", "ok", "arkcli on PATH");
  } catch {
    add("arkcli", "warn", "current vendor is 火山 but arkcli not on PATH — 底部用量行不会出现");
  }
}

const processKey = process.env.ANTHROPIC_API_KEY;
const processToken = process.env.ANTHROPIC_AUTH_TOKEN;
const settingsToken = live?.env?.ANTHROPIC_AUTH_TOKEN;
const settingsKey = live?.env?.ANTHROPIC_API_KEY;
const both =
  (Boolean(processKey) || Boolean(settingsKey)) &&
  (Boolean(processToken) || Boolean(settingsToken));
add(
  "auth_conflict",
  both ? "fail" : "ok",
  both
    ? `both set. process API_KEY=${processKey ? previewSecret(processKey) : "no"} AUTH_TOKEN=${processToken ? previewSecret(processToken) : "no"}; settings API_KEY=${settingsKey ? previewSecret(settingsKey) : "no"} AUTH_TOKEN=${settingsToken ? previewSecret(settingsToken) : "no"}`
    : "single auth method",
);

if (process.env.ANTHROPIC_BASE_URL) {
  add("process_base_url", "warn", process.env.ANTHROPIC_BASE_URL);
}

const dbPath = ccSwitchDbPath();
const db = openCcSwitchDb();
let commonCommand = "";
if (!db) {
  add("cc_switch_db", "warn", `missing ${dbPath}`);
} else {
  add("cc_switch_db", "ok", dbPath);
  const common = readCommonConfig(db);
  commonCommand = common?.statusLine?.command || "";
  const commonKind = commandKind(commonCommand);
  add(
    "common_command",
    commonKind === "hud" ? "ok" : "fail",
    commonKind === "missing"
      ? "common_config_claude has no statusLine — next switch will drop HUD"
      : `${commonKind}: ${commonCommand}`,
  );
  for (const p of listClaudeProviders(db)) {
    add(
      `provider_${p.id}`,
      p.kind === "hud" || (!p.hasStatusLine && p.id === "claude-official")
        ? "ok"
        : "warn",
      `${p.name} current=${p.current} ${p.hasStatusLine ? p.kind + ": " + p.command : "no statusLine"}`,
    );
  }
}

const fail = checks.filter((c) => c.status === "fail").length;
const warn = checks.filter((c) => c.status === "warn").length;
const report = {
  summary: { fail, warn, ok: checks.filter((c) => c.status === "ok").length },
  live_command: liveCommand,
  common_command: commonCommand,
  process_env: ["ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN", "ANTHROPIC_BASE_URL"]
    .map(envPreview)
    .filter(Boolean),
  checks,
};
if (db) db.close();
console.log(JSON.stringify(report, null, 2));
process.exit(fail > 0 ? 2 : 0);
