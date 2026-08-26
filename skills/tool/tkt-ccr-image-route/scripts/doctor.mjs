#!/usr/bin/env node
import {
  RULE_ID,
  listProviderModels,
  normalizeModel,
  openCcrDb,
  findImageRule,
  readCcrConfig,
  findCcrLaunchdLabel,
} from "./lib.mjs";

function parseArgs(argv) {
  const out = { model: null };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === "--model" && argv[i + 1]) {
      out.model = normalizeModel(argv[i + 1]);
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
  add("ccr_db", "fail", "missing config.sqlite — install CCR first");
} else {
  add("ccr_db", "ok", "present");
  cfg = readCcrConfig(db);
  add("ccr_config", cfg ? "ok" : "fail", cfg ? "default loaded" : "empty");
}

const rule = cfg ? findImageRule(cfg) : null;
if (!rule) {
  add("image_rule", "fail", `missing id=${RULE_ID}`);
} else {
  const enabled = rule.enabled !== false;
  const target = normalizeModel(rule.target || rule.rewrite?.value || "");
  add("image_rule", enabled ? "ok" : "warn", `enabled=${enabled} target=${target || "?"}`);
  if (expectModel && target !== expectModel) {
    add("image_rule_target", "warn", `expected ${expectModel}, got ${target}`);
  }
}

if (expectModel && cfg) {
  add(
    "provider_model",
    listProviderModels(cfg).includes(expectModel) ? "ok" : "fail",
    expectModel,
  );
}

const legacy = (cfg?.Router?.rules || []).filter((r) => r.id === "route-image-to-doubao");
if (legacy.length) add("legacy_rule", "warn", "route-image-to-doubao still present — apply removes");

add(
  "launchd_label",
  findCcrLaunchdLabel() ? "ok" : "warn",
  findCcrLaunchdLabel() || "no launchd plist",
);

if (db) db.close();

const fail = checks.filter((c) => c.status === "fail").length;
console.log(
  JSON.stringify(
    { summary: { fail, warn: checks.filter((c) => c.status === "warn").length }, checks },
    null,
    2,
  ),
);
process.exit(fail > 0 ? 2 : 0);
