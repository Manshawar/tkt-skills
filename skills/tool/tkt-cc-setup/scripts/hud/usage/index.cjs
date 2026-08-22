#!/usr/bin/env node
/**
 * 当前供应商用量行。vendors/*.cjs 里谁 match(BASE_URL) 谁输出，挂在 HUD 最底一行。
 * 新厂家：在 vendors/ 加一个 { id, match(url), fetchLine() } 即可。
 */
const fs = require("node:fs");
const path = require("node:path");

const vendorDir = path.join(__dirname, "vendors");

function readBaseUrl() {
  if (process.env.ANTHROPIC_BASE_URL) return process.env.ANTHROPIC_BASE_URL;
  try {
    const claudeDir = process.env.CLAUDE_CONFIG_DIR || path.join(require("node:os").homedir(), ".claude");
    const settings = JSON.parse(fs.readFileSync(path.join(claudeDir, "settings.json"), "utf8"));
    return settings.env?.ANTHROPIC_BASE_URL || "";
  } catch {
    return "";
  }
}

const baseUrl = readBaseUrl();

function loadVendors() {
  if (!fs.existsSync(vendorDir)) return [];
  return fs
    .readdirSync(vendorDir)
    .filter((name) => name.endsWith(".cjs"))
    .map((name) => require(path.join(vendorDir, name)))
    .filter((v) => v && typeof v.match === "function" && typeof v.fetchLine === "function");
}

try {
  for (const vendor of loadVendors()) {
    if (!vendor.match(baseUrl)) continue;
    const line = vendor.fetchLine();
    if (line) process.stdout.write(String(line).replace(/\s+/g, " ").trim());
    break;
  }
} catch {
  process.exit(0);
}
