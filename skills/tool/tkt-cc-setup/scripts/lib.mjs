import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

export function home() {
  return os.homedir();
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

export function hudPluginDir() {
  return path.join(claudeDir(), "plugins", "claude-hud");
}

export function hudLauncherPath() {
  return path.join(hudPluginDir(), "statusline.mjs");
}

export function skillHudDir() {
  return path.join(path.dirname(fileURLToPath(import.meta.url)), "hud");
}

export function toGitBashPath(winPath) {
  const normalized = String(winPath).replace(/\\/g, "/");
  const m = /^([A-Za-z]):\/(.*)$/.exec(normalized);
  if (!m) return normalized;
  return `/${m[1].toLowerCase()}/${m[2]}`;
}

export function nodeForStatusLine() {
  const exe = process.execPath;
  const noExe = exe.replace(/\.exe$/i, "");
  return toGitBashPath(noExe);
}

export function hudCommand() {
  const launcher = hudLauncherPath().replace(/\\/g, "/");
  return `${nodeForStatusLine()} ${launcher}`;
}

export function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function writeJson(file, obj) {
  fs.writeFileSync(file, `${JSON.stringify(obj, null, 2)}\n`, "utf8");
}

export function previewSecret(value) {
  if (typeof value !== "string" || !value) return "";
  return `${value.slice(0, 8)}... len=${value.length}`;
}

export function commandKind(command) {
  if (!command) return "missing";
  if (command.includes("statusline.mjs")) return "hud";
  if (command.includes("statusline.js")) return "legacy";
  if (/cmd\.exe/i.test(command)) return "cmd-exe";
  return "other";
}

export function openCcSwitchDb() {
  const dbPath = ccSwitchDbPath();
  if (!fs.existsSync(dbPath)) return null;
  return new DatabaseSync(dbPath);
}

export function readCommonConfig(db) {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'common_config_claude'").get();
  if (!row?.value) return null;
  return JSON.parse(row.value);
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
        hasStatusLine: Boolean(cfg.statusLine),
        command: cfg.statusLine?.command || "",
        kind: commandKind(cfg.statusLine?.command),
      };
    });
}

export function desiredStatusLine() {
  return {
    type: "command",
    command: hudCommand(),
    padding: 0,
    refreshInterval: 5,
  };
}
