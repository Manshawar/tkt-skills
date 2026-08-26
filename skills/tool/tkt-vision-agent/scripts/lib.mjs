import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const AGENT_NAME = "vision-analyst";
export const CLAUDE_MD_BEGIN = "<!-- tkt-vision-agent:begin -->";
export const CLAUDE_MD_END = "<!-- tkt-vision-agent:end -->";
export const LEGACY_CLAUDE_MD_BEGIN = "<!-- tkt-ccr-vision:begin -->";
export const LEGACY_CLAUDE_MD_END = "<!-- tkt-ccr-vision:end -->";

export function home() {
  return os.homedir();
}

export function skillDir() {
  return path.dirname(path.dirname(fileURLToPath(import.meta.url)));
}

export function claudeDir() {
  return process.env.CLAUDE_CONFIG_DIR || path.join(home(), ".claude");
}

export function claudeMdPath() {
  return path.join(claudeDir(), "CLAUDE.md");
}

export function agentPath() {
  return path.join(claudeDir(), "agents", `${AGENT_NAME}.md`);
}

export function templatePath(name) {
  return path.join(skillDir(), "templates", name);
}

export function readText(file) {
  return fs.readFileSync(file, "utf8");
}

export function writeText(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text.endsWith("\n") ? text : `${text}\n`, "utf8");
}

export function normalizeModel(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";
  if (s.includes("/")) return s;
  const i = s.indexOf(",");
  if (i > 0) return `${s.slice(0, i).trim()}/${s.slice(i + 1).trim()}`;
  return s;
}

export function renderTemplate(name, vars) {
  let text = readText(templatePath(name));
  for (const [key, value] of Object.entries(vars)) {
    text = text.replaceAll(`{{${key}}}`, value);
  }
  return text;
}

export function installAgent(model, dryRun) {
  const content = renderTemplate("vision-analyst.md", {
    VISION_MODEL: normalizeModel(model),
  });
  const dest = agentPath();
  if (dryRun) return { path: dest, bytes: Buffer.byteLength(content, "utf8"), dryRun: true };
  writeText(dest, content);
  return { path: dest, bytes: Buffer.byteLength(content, "utf8"), dryRun: false };
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function syncClaudeMd(model, dryRun) {
  const snippet = renderTemplate("claude-md-snippet.md", {
    VISION_MODEL: normalizeModel(model),
  });
  const wrapped = `${CLAUDE_MD_BEGIN}\n${snippet.trim()}\n${CLAUDE_MD_END}`;
  let body = fs.existsSync(claudeMdPath()) ? readText(claudeMdPath()) : "";
  for (const [begin, end] of [
    [CLAUDE_MD_BEGIN, CLAUDE_MD_END],
    [LEGACY_CLAUDE_MD_BEGIN, LEGACY_CLAUDE_MD_END],
  ]) {
    const re = new RegExp(`${escapeRegExp(begin)}[\\s\\S]*?${escapeRegExp(end)}`, "m");
    body = re.test(body) ? body.replace(re, wrapped) : body;
  }
  if (!body.includes(CLAUDE_MD_BEGIN)) body = `${body.trim()}\n\n${wrapped}\n`;
  if (dryRun) return { path: claudeMdPath(), dryRun: true };
  writeText(claudeMdPath(), body);
  return { path: claudeMdPath(), dryRun: false };
}

export function parseAgentModel(file) {
  if (!fs.existsSync(file)) return null;
  const m = readText(file).match(/^model:\s*(.+)$/m);
  return m ? m[1].trim() : null;
}

export function claudeMdHasSnippet() {
  if (!fs.existsSync(claudeMdPath())) return false;
  const t = readText(claudeMdPath());
  return t.includes(CLAUDE_MD_BEGIN) || t.includes(LEGACY_CLAUDE_MD_BEGIN);
}
