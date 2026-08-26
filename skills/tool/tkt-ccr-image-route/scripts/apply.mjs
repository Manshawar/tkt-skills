#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import {
  RULE_ID,
  findCcrLaunchdLabel,
  findImageRule,
  normalizeModel,
  openCcrDb,
  providerHasModel,
  readCcrConfig,
  upsertImageRule,
  writeCcrConfig,
} from "./lib.mjs";

function usage() {
  console.error(
    "Usage: node --experimental-sqlite scripts/apply.mjs --model 'Provider/model' [--dry-run] [--no-reload]",
  );
  process.exit(1);
}

function parseArgs(argv) {
  const out = { model: null, dryRun: false, reload: true };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--dry-run") out.dryRun = true;
    else if (a === "--no-reload") out.reload = false;
    else if (a === "--model" && argv[i + 1]) {
      out.model = normalizeModel(argv[i + 1]);
      i += 1;
    }
  }
  return out;
}

const args = parseArgs(process.argv);
if (!args.model) usage();

const errors = [];
const changes = [];

const db = openCcrDb();
if (!db) {
  errors.push("CCR db missing");
} else {
  const cfg = readCcrConfig(db);
  if (!cfg) errors.push("CCR config empty");
  else if (!providerHasModel(cfg, args.model)) {
    errors.push(`model not in Providers: ${args.model}`);
  } else {
    const before = findImageRule(cfg);
    const next = upsertImageRule(cfg, args.model);
    if (!args.dryRun) writeCcrConfig(db, next);
    changes.push({
      step: "ccr_image_rule",
      id: RULE_ID,
      from: before?.target || null,
      to: args.model,
      enabled: true,
      dryRun: args.dryRun,
    });
  }
  db.close();
}

if (args.reload && !args.dryRun && !errors.length) {
  const label = findCcrLaunchdLabel();
  if (label) {
    try {
      execFileSync("launchctl", ["kickstart", "-k", `gui/${process.getuid()}/${label}`]);
      changes.push({ step: "ccr_reload", ok: true, label });
    } catch (e) {
      changes.push({ step: "ccr_reload", ok: false, reason: String(e.message || e) });
    }
  } else {
    changes.push({ step: "ccr_reload", ok: false, reason: "no launchd label" });
  }
}

console.log(
  JSON.stringify(
    {
      dryRun: args.dryRun,
      model: args.model,
      changes,
      errors,
      next: errors.length ? "fix and re-run" : "restart claude; Read a PNG to verify resolved_model",
    },
    null,
    2,
  ),
);
process.exit(errors.length ? 2 : 0);
