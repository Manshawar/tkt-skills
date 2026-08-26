#!/usr/bin/env node
import fs from "node:fs";
import {
  AGENT_NAME,
  CLAUDE_MD_BEGIN,
  agentPath,
  claudeMdHasSnippet,
  claudeMdPath,
  parseAgentModel,
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

const agentFile = agentPath();
if (!fs.existsSync(agentFile)) {
  add("vision_agent", "fail", `missing ~/.claude/agents/${AGENT_NAME}.md`);
} else {
  const m = parseAgentModel(agentFile);
  add("vision_agent", "ok", `model=${m || "?"}`);
  if (expectModel && m !== expectModel) {
    add("vision_agent_model", "warn", `expected ${expectModel}, got ${m}`);
  }
}

add(
  "claude_md_snippet",
  claudeMdHasSnippet() ? "ok" : "fail",
  claudeMdHasSnippet() ? claudeMdPath() : `missing ${CLAUDE_MD_BEGIN}`,
);

const fail = checks.filter((c) => c.status === "fail").length;
console.log(JSON.stringify({ summary: { fail }, checks }, null, 2));
process.exit(fail > 0 ? 2 : 0);
