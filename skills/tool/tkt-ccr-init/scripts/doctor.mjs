#!/usr/bin/env node
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import {
  ccrBaseUrl,
  ccrDbPath,
  defaultApiKeyHelperPath,
  findCcrLaunchdLabel,
  helperLooksOk,
  isShortAliasModel,
  openCcrDb,
  openCcSwitchDb,
  portInUse,
  previewSecret,
  probeCcrHttp,
  readCcrConfig,
  readCommonConfig,
  readJson,
  settingsPath,
} from "./lib.mjs";

function parseArgs(argv) {
  const out = { model: null };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === "--model" && argv[i + 1]) {
      out.model = argv[i + 1];
      i += 1;
    }
  }
  return out;
}

const { model: expectModel } = parseArgs(process.argv);
const checks = [];
function add(id, status, detail) {
  checks.push({ id, status, detail });
}

const db = openCcrDb();
let cfg = null;
if (!db) {
  add("ccr_db", "fail", `missing ${ccrDbPath()} — install @musistudio/claude-code-router first`);
} else {
  add("ccr_db", "ok", ccrDbPath());
  cfg = readCcrConfig(db);
  add("ccr_config", cfg ? "ok" : "fail", cfg ? "default profile loaded" : "empty default profile");
}

const baseUrl = cfg ? ccrBaseUrl(cfg) : "http://127.0.0.1:3456";
const port = cfg?.PORT || 3456;
add("ccr_port_listen", portInUse(port) ? "ok" : "fail", `port ${port} ${portInUse(port) ? "listening" : "not listening"}`);
add(
  "ccr_http",
  probeCcrHttp(baseUrl) ? "ok" : "warn",
  `${baseUrl} reachable=${probeCcrHttp(baseUrl)}`,
);

const launchd = findCcrLaunchdLabel();
add("launchd_label", launchd ? "ok" : "warn", launchd || "no com.*.ccr.plist — see references/launchd.md");

try {
  const ps = execFileSync("ps", ["aux"], { encoding: "utf8" });
  const daemonChild = ps.includes("daemon-child") && ps.includes("claude-code-router");
  add(
    "ccr_start_conflict",
    daemonChild ? "warn" : "ok",
    daemonChild
      ? "found ccr --daemon-child — may conflict with launchd on 3456"
      : "no daemon-child process",
  );
} catch {
  add("ccr_start_conflict", "warn", "could not scan processes");
}

const proxyMode = cfg?.proxy?.upstream?.mode;
add(
  "proxy_upstream",
  proxyMode === "system" ? "warn" : "ok",
  `proxy.upstream.mode=${proxyMode || "(default)"}${proxyMode === "system" ? " — Clash down => 502" : ""}`,
);

const settingsFile = settingsPath();
let settings = null;
if (!fs.existsSync(settingsFile)) {
  add("settings_json", "fail", `missing ${settingsFile}`);
} else {
  settings = readJson(settingsFile);
  add("settings_json", "ok", settingsFile);
  const liveBase = settings?.env?.ANTHROPIC_BASE_URL || "";
  add(
    "settings_base_url",
    liveBase === baseUrl ? "ok" : "warn",
    `ANTHROPIC_BASE_URL=${liveBase || "(unset)"} expected ${baseUrl}`,
  );
  const mainModel = settings?.model || "";
  add(
    "settings_model",
    isShortAliasModel(mainModel) ? "fail" : mainModel ? "ok" : "warn",
    `model=${mainModel || "(empty)"}${isShortAliasModel(mainModel) ? " — use Provider/model full name" : ""}`,
  );
  add(
    "auth_mode",
    settings?.env?.CCR_CLAUDE_CODE_AUTH_MODE === "api-key-helper" ? "ok" : "warn",
    `CCR_CLAUDE_CODE_AUTH_MODE=${settings?.env?.CCR_CLAUDE_CODE_AUTH_MODE || "(unset)"}`,
  );
  const helper = settings?.apiKeyHelper || defaultApiKeyHelperPath();
  add(
    "api_key_helper",
    helperLooksOk(helper) ? "ok" : "fail",
    helperLooksOk(helper) ? helper : `missing or not executable: ${helper}`,
  );
}

for (const name of ["ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN"]) {
  const v = process.env[name];
  if (v) add(`process_${name.toLowerCase()}`, "warn", `${name}=${previewSecret(v)} in shell — may override CCR WIF`);
}

const cs = openCcSwitchDb();
if (!cs) {
  add("cc_switch_db", "warn", "missing ~/.cc-switch/cc-switch.db — settings may not survive provider switch");
} else {
  add("cc_switch_db", "ok", "cc-switch.db present");
  const common = readCommonConfig(cs);
  const commonBase = common?.env?.ANTHROPIC_BASE_URL || "";
  add(
    "common_base_url",
    commonBase === baseUrl ? "ok" : "warn",
    `common_config ANTHROPIC_BASE_URL=${commonBase || "(unset)"}`,
  );
  if (settings && common?.model && common.model !== settings.model) {
    add("common_model_drift", "warn", `common=${common.model} live=${settings.model}`);
  }
  cs.close();
}

if (cfg) {
  const providers = (cfg.Providers || []).map((p) => p.name).filter(Boolean);
  add("ccr_providers", providers.length ? "ok" : "fail", providers.slice(0, 8).join(", ") || "(none)");
  if (expectModel) {
    const [pn] = expectModel.includes("/") ? expectModel.split("/", 2) : ["", expectModel];
    const p = (cfg.Providers || []).find((x) => x.name === pn);
    if (p) {
      const md = p.modelMetadata || {};
      const sample = (p.models || [])[0];
      const cw = sample ? md[sample]?.contextWindow : null;
      add("provider_context", cw ? "ok" : "warn", `${pn} sample contextWindow=${cw || "unset"}`);
    }
  }
}

if (db) db.close();

const fail = checks.filter((c) => c.status === "fail").length;
const warn = checks.filter((c) => c.status === "warn").length;
console.log(JSON.stringify({ summary: { fail, warn, ok: checks.filter((c) => c.status === "ok").length }, checks }, null, 2));
process.exit(fail > 0 ? 2 : 0);
