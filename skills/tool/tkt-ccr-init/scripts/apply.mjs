#!/usr/bin/env node
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import {
  applyMainModel,
  ccrBaseUrl,
  defaultApiKeyHelperPath,
  findCcrLaunchdLabel,
  fixProxyUpstream,
  helperLooksOk,
  mergeCcrEnv,
  normalizeModel,
  openCcrDb,
  openCcSwitchDb,
  providerNameFromModel,
  readCcrConfig,
  readJson,
  setProviderContextWindow,
  settingsPath,
  syncLiveAndCcSwitch,
  writeCcrConfig,
  writeJson,
} from "./lib.mjs";

function usage() {
  console.error(`Usage:
  node --experimental-sqlite scripts/apply.mjs [--main-model Provider/model] [--context-tokens N] [--dry-run]
    [--skip-ccr] [--skip-settings] [--no-reload]`);
  process.exit(1);
}

function parseArgs(argv) {
  const out = {
    mainModel: null,
    contextTokens: 1000000,
    dryRun: false,
    skipCcr: false,
    skipSettings: false,
    reload: true,
  };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--dry-run") out.dryRun = true;
    else if (a === "--skip-ccr") out.skipCcr = true;
    else if (a === "--skip-settings") out.skipSettings = true;
    else if (a === "--no-reload") out.reload = false;
    else if (a === "--main-model" && argv[i + 1]) {
      out.mainModel = normalizeModel(argv[i + 1]);
      i += 1;
    } else if (a === "--context-tokens" && argv[i + 1]) {
      out.contextTokens = Number(argv[i + 1]);
      i += 1;
    }
  }
  return out;
}

const args = parseArgs(process.argv);
const changes = [];
const errors = [];

function push(step, detail) {
  changes.push({ step, ...detail });
}

if (!args.skipCcr) {
  const db = openCcrDb();
  if (!db) {
    errors.push("CCR config.sqlite missing");
  } else {
    let cfg = readCcrConfig(db);
    if (!cfg) errors.push("CCR default config empty");
    else {
      const beforeProxy = cfg?.proxy?.upstream?.mode;
      cfg = fixProxyUpstream(cfg);
      if (args.mainModel) {
        const pn = providerNameFromModel(args.mainModel);
        if (pn) cfg = setProviderContextWindow(cfg, pn, args.contextTokens);
      }
      if (!args.dryRun) writeCcrConfig(db, cfg);
      push("ccr_proxy", { from: beforeProxy, to: "none", dryRun: args.dryRun });
      if (args.mainModel) {
        push("ccr_provider_context", {
          provider: providerNameFromModel(args.mainModel),
          contextTokens: args.contextTokens,
          dryRun: args.dryRun,
        });
      }
    }
    db.close();
  }
}

if (!args.skipSettings) {
  const file = settingsPath();
  if (!fs.existsSync(file)) {
    errors.push(`missing ${file}`);
  } else {
    const settings = readJson(file);
    const db = openCcrDb();
    const cfg = db ? readCcrConfig(db) : null;
    if (db) db.close();
    const baseUrl = cfg ? ccrBaseUrl(cfg) : "http://127.0.0.1:3456";
    const helper = defaultApiKeyHelperPath();
    settings.env = mergeCcrEnv(settings.env, baseUrl, args.contextTokens);
    if (helperLooksOk(helper) || fs.existsSync(helper)) {
      settings.apiKeyHelper = helper;
    }
    if (args.mainModel) applyMainModel(settings, args.mainModel);
    push("settings_json", {
      path: file,
      model: settings.model,
      baseUrl,
      authMode: settings.env.CCR_CLAUDE_CODE_AUTH_MODE,
      dryRun: args.dryRun,
    });
    if (!args.dryRun) writeJson(file, settings);
    const cs = openCcSwitchDb();
    const sync = syncLiveAndCcSwitch(settings, cs, args.dryRun);
    if (cs) cs.close();
    push("cc_switch_sync", sync);
  }
}

let reload = null;
if (args.reload && !args.dryRun && errors.length === 0) {
  const label = findCcrLaunchdLabel();
  if (!label) {
    reload = { ok: false, reason: "launchd label not found" };
  } else {
    try {
      execFileSync("launchctl", ["kickstart", "-k", `gui/${process.getuid()}/${label}`]);
      reload = { ok: true, label };
    } catch (e) {
      reload = { ok: false, reason: String(e.message || e) };
    }
  }
  push("ccr_reload", reload);
}

console.log(
  JSON.stringify(
    {
      dryRun: args.dryRun,
      mainModel: args.mainModel,
      contextTokens: args.contextTokens,
      changes,
      errors,
      next: errors.length
        ? "fix blockers then re-run doctor"
        : "restart claude; optional: tkt-vision-agent; image-route backup: docs/ccr-image-route-backup.md",
    },
    null,
    2,
  ),
);
process.exit(errors.length ? 2 : 0);
