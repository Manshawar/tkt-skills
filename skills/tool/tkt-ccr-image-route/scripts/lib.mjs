import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

export const RULE_ID = "route-image-to-vision";
export const LEGACY_RULE_IDS = ["route-image-to-doubao"];

export function home() {
  return os.homedir();
}

export function skillDir() {
  return path.dirname(path.dirname(fileURLToPath(import.meta.url)));
}

export function ccrDbPath() {
  return path.join(home(), ".claude-code-router", "config.sqlite");
}

export function normalizeModel(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";
  if (s.includes("/")) return s;
  const i = s.indexOf(",");
  if (i > 0) return `${s.slice(0, i).trim()}/${s.slice(i + 1).trim()}`;
  return s;
}

export function openCcrDb() {
  const dbPath = ccrDbPath();
  if (!fs.existsSync(dbPath)) return null;
  return new DatabaseSync(dbPath);
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

export function listProviderModels(cfg) {
  const out = [];
  for (const p of cfg?.Providers || []) {
    const provider = String(p?.name || "").trim();
    if (!provider || !Array.isArray(p.models)) continue;
    for (const m of p.models) {
      const model = String(m || "").trim();
      if (model) out.push(`${provider}/${model}`);
    }
  }
  return out.sort();
}

export function providerHasModel(cfg, model) {
  return listProviderModels(cfg).includes(normalizeModel(model));
}

export function buildImageRule(model) {
  const target = normalizeModel(model);
  return {
    id: RULE_ID,
    name: "image -> multimodal provider",
    type: "condition",
    enabled: true,
    condition: {
      left: "request.body.messages",
      operator: "contains-deep",
      right: '{"type":"image"}',
    },
    target,
    rewrite: {
      key: "request.body.model",
      operation: "set",
      value: target,
    },
    rewrites: [{ key: "request.body.model", operation: "set", value: target }],
  };
}

export function findImageRule(cfg) {
  return (cfg?.Router?.rules || []).find((r) => r?.id === RULE_ID) || null;
}

export function upsertImageRule(cfg, model) {
  const next = structuredClone(cfg);
  next.Router ||= {};
  next.Router.rules ||= [];
  const rule = buildImageRule(model);
  const idx = next.Router.rules.findIndex((r) => r?.id === RULE_ID);
  if (idx >= 0) next.Router.rules[idx] = rule;
  else next.Router.rules.push(rule);
  next.Router.rules = next.Router.rules.filter(
    (r) => !LEGACY_RULE_IDS.includes(r?.id) && !String(r?.id || "").startsWith("alias-"),
  );
  return next;
}

export function findCcrLaunchdLabel() {
  const dir = path.join(home(), "Library", "LaunchAgents");
  if (!fs.existsSync(dir)) return null;
  return (
    fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".plist") && /ccr/i.test(f))
      .map((f) => f.replace(/\.plist$/, ""))[0] || null
  );
}
