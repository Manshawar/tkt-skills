#!/usr/bin/env node
import { installAgent, normalizeModel, syncClaudeMd } from "./lib.mjs";

function usage() {
  console.error(
    "Usage: node scripts/apply.mjs --model 'Provider/model' [--dry-run] [--skip-agent] [--skip-claude-md]",
  );
  process.exit(1);
}

function parseArgs(argv) {
  const out = { model: null, dryRun: false, skipAgent: false, skipClaudeMd: false };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--dry-run") out.dryRun = true;
    else if (a === "--skip-agent") out.skipAgent = true;
    else if (a === "--skip-claude-md") out.skipClaudeMd = true;
    else if (a === "--model" && argv[i + 1]) {
      out.model = normalizeModel(argv[i + 1]);
      i += 1;
    }
  }
  return out;
}

const args = parseArgs(process.argv);
if (!args.model) usage();

const changes = [];
if (!args.skipAgent) changes.push({ step: "vision_agent", ...installAgent(args.model, args.dryRun) });
if (!args.skipClaudeMd) changes.push({ step: "claude_md", ...syncClaudeMd(args.model, args.dryRun) });

console.log(
  JSON.stringify(
    {
      dryRun: args.dryRun,
      model: args.model,
      changes,
      next: "restart claude. Non-Fusion Read+image fallback: docs/ccr-image-route-backup.md",
    },
    null,
    2,
  ),
);
