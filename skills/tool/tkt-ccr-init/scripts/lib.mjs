import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

export const SHORT_ALIASES = new Set(["fable", "haiku", "sonnet", "opus"]);
export const CCR_ENV_KEYS = [
  "ANTHROPIC_API_BASE_URL",
  "ANTHROPIC_BASE_URL",
  "CLAUDE_AGENT_API_BASE_URL",
  "API_TIMEOUT_MS",
  "CLAUDE_CODE_ATTRIBUTION_HEADER",
  "CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY",
  "CCR_CLAUDE_CODE_AUTH_MODE",
  "CCR_CLAUDE_CODE_MCP_CONFIG",
  "CODEXL_CLAUDE_CODE_MCP_CONFIG",
];

export function home() {
  return os.homedir();
}

export function skillDir() {
  return path.dirname(path.dirname(fileURLToPath(import.meta.url)));
}

export function claudeDir() {
  return process.env.CLAUDE_CONFIG_DIR || path.join(home(), ".claude");
}

export function settingsPath() {
  return path.join(claudeDir(), "settings.json");
}

export function ccSwitchDbPath() {
  return path.join(home(), ".cc-switch", "cc-switch.db");
}

export function ccrDbPath() {
  return path.join(home(), ".claude-code-router", "config.sqlite");
}

export function ccrBinDir() {
  return path.join(home(), ".claude-code-router", "bin");
}

export function defaultApiKeyHelperPath() {
  return path.join(ccrBinDir(), "ccr-claude-code-api-key-default-claude-code");
}

export function readText(file) {
  return fs.readFileSync(file, "utf8");
}

export function writeJson(file, obj) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(obj, null, 2)}\n`, "utf8");
}

export function readJson(file) {
  return JSON.parse(readText(file));
}

export function previewSecret(value) {
  if (typeof value !== "string" || !value) return "";
  return `${value.slice(0, 8)}... len=${value.length}`;
}

export function normalizeModel(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";
  if (s.includes("/")) return s;
  const i = s.indexOf(",");
  if (i > 0) return `${s.slice(0, i).trim()}/${s.slice(i + 1).trim()}`;
  return s;
}

export function isShortAliasModel(model) {
  return SHORT_ALIASES.has(String(model || "").trim().toLowerCase());
}

export function openCcrDb() {
  const p = ccrDbPath();
  if (!fs.existsSync(p)) return null;
  return new DatabaseSync(p);
}

export function readCcrConfig(db) {
  const row = db.prepare("SELECT value_json FROM app_config WHERE key = 'default'").get();
  if (!row?.value_json) return null;
  return JSON.parse(row.value_json);
}

export function writeCcrConfig(db, cfg) {
  db.prepare(
    "UPDATE app_config SET value_json = ?, updated_at = datetime('now') WHERE key = 'default'",
  ).run(JSON.stringify(cfg));
}

export function ccrBaseUrl(cfg) {
  const host = cfg?.HOST || "127.0.0.1";
  const port = cfg?.PORT || 3456;
  return `http://${host}:${port}`;
}

export function openCcSwitchDb() {
  const p = ccSwitchDbPath();
  if (!fs.existsSync(p)) return null;
  return new DatabaseSync(p);
}

export function readCommonConfig(db) {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'common_config_claude'").get();
  if (!row?.value) return null;
  return JSON.parse(row.value);
}

export function writeCommonConfig(db, common) {
  db.prepare("UPDATE settings SET value = ? WHERE key = 'common_config_claude'").run(
    JSON.stringify(common),
  );
}

export function listClaudeProviders(db) {
  return db
    .prepare(
      "SELECT id, name, is_current, settings_config FROM providers WHERE app_type = 'claude'",
    )
    .all()
    .map((row) => {
      let cfg = {};
      try {
        cfg = JSON.parse(row.settings_config || "{}");
      } catch {
        cfg = {};
      }
      return {
        id: row.id,
        name: row.name,
        current: Boolean(row.is_current),
        settings: cfg,
      };
    });
}

export function getCurrentProvider(db) {
  return listClaudeProviders(db).find((p) => p.current) || null;
}

export function findCcrLaunchdLabel() {
  const dir = path.join(home(), "Library", "LaunchAgents");
  if (!fs.existsSync(dir)) return null;
  const hits = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".plist") && /ccr/i.test(f))
    .map((f) => f.replace(/\.plist$/, ""));
  return hits[0] || null;
}

export function portInUse(port) {
  try {
    const out = execFileSync("lsof", ["-i", `:${port}`, "-sTCP:LISTEN"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return out.trim().length > 0;
  } catch {
    return false;
  }
}

export function probeCcrHttp(baseUrl) {
  try {
    const code = execFileSync(
      "curl",
      ["-s", "-o", "/dev/null", "-w", "%{http_code}", `${baseUrl}/`],
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
        timeout: 3000,
      },
    ).trim();
    return code === "200" || code === "404" || code === "401";
  } catch {
    return false;
  }
}

export function helperLooksOk(file) {
  if (!fs.existsSync(file)) return false;
  try {
    fs.accessSync(file, fs.constants.X_OK);
  } catch {
    return false;
  }
  return true;
}

export function mergeCcrEnv(existing, baseUrl, contextTokens) {
  const env = { ...(existing || {}) };
  env.ANTHROPIC_API_BASE_URL = baseUrl;
  env.ANTHROPIC_BASE_URL = baseUrl;
  env.CLAUDE_AGENT_API_BASE_URL = baseUrl;
  env.CCR_CLAUDE_CODE_AUTH_MODE = "api-key-helper";
  env.API_TIMEOUT_MS ||= "3000000";
  env.CLAUDE_CODE_ATTRIBUTION_HEADER ||= "0";
  env.CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY ||= "1";
  if (contextTokens) {
    env.CLAUDE_CODE_MAX_CONTEXT_TOKENS = String(contextTokens);
    env.CLAUDE_CODE_AUTO_COMPACT_WINDOW = String(contextTokens);
  }
  const mcp = path.join(
    home(),
    ".claude-code-router/profiles/default-claude-code/claude/toolhub-mcp.json",
  );
  if (fs.existsSync(mcp)) {
    env.CCR_CLAUDE_CODE_MCP_CONFIG = mcp;
    env.CODEXL_CLAUDE_CODE_MCP_CONFIG = mcp;
  }
  return env;
}

export function applyMainModel(settings, model) {
  const m = normalizeModel(model);
  if (!m) return settings;
  settings.model = m;
  settings.env ||= {};
  settings.env.ANTHROPIC_MODEL = m.includes("[") ? m : `${m}[1m]`;
  settings.env.CCR_CLAUDE_CODE_MODEL = settings.env.ANTHROPIC_MODEL;
  settings.env.CODEXL_CLAUDE_CODE_MODEL = settings.env.ANTHROPIC_MODEL;
  return settings;
}

export function fixProxyUpstream(cfg) {
  const next = structuredClone(cfg);
  next.proxy ||= {};
  next.proxy.upstream ||= {};
  next.proxy.upstream.mode = "none";
  return next;
}

export function setProviderContextWindow(cfg, providerName, tokens) {
  const next = structuredClone(cfg);
  const n = Number(tokens);
  if (!Number.isFinite(n) || n <= 0) return next;
  for (const p of next.Providers || []) {
    if (p.name !== providerName) continue;
    p.modelMetadata ||= {};
    for (const model of p.models || []) {
      p.modelMetadata[model] = {
        ...(p.modelMetadata[model] || {}),
        contextWindow: n,
        maxContextWindow: n,
      };
    }
  }
  return next;
}

export function providerNameFromModel(model) {
  const m = normalizeModel(model);
  const i = m.indexOf("/");
  return i > 0 ? m.slice(0, i) : "";
}

export function syncLiveAndCcSwitch(settings, db, dryRun) {
  if (!db) return { ok: false, reason: "cc-switch.db missing" };
  const common = readCommonConfig(db) || {};
  common.env = { ...(common.env || {}), ...(settings.env || {}) };
  common.model = settings.model;
  if (settings.apiKeyHelper) common.apiKeyHelper = settings.apiKeyHelper;
  if (!dryRun) writeCommonConfig(db, common);
  const update = db.prepare("UPDATE providers SET settings_config = ? WHERE id = ?");
  const changes = [];
  for (const p of listClaudeProviders(db)) {
    const cfg = { ...p.settings };
    cfg.env = { ...(cfg.env || {}), ...(settings.env || {}) };
    cfg.model = settings.model;
    if (settings.apiKeyHelper) cfg.apiKeyHelper = settings.apiKeyHelper;
    if (!dryRun) update.run(JSON.stringify(cfg), p.id);
    if (p.current) changes.push({ provider: p.name, model: cfg.model });
  }
  return { ok: true, changes };
}
