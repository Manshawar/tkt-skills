#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {
  desiredStatusLine,
  hudLauncherPath,
  hudPluginDir,
  openCcSwitchDb,
  readCommonConfig,
  readJson,
  settingsPath,
  skillHudDir,
  writeJson,
} from "./lib.mjs";

function copyHudOverlay(dryRun) {
  const src = skillHudDir();
  const dest = hudPluginDir();
  if (!fs.existsSync(src)) {
    throw new Error(`missing skill hud overlay: ${src}`);
  }
  if (dryRun) {
    return { from: src, to: dest, copied: ["statusline.mjs", "hud-local.json", "usage/"] };
  }
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(path.join(src, "statusline.mjs"), path.join(dest, "statusline.mjs"));
  const localCfg = path.join(dest, "hud-local.json");
  if (!fs.existsSync(localCfg)) {
    fs.copyFileSync(path.join(src, "hud-local.json"), localCfg);
  }
  fs.cpSync(path.join(src, "usage"), path.join(dest, "usage"), { recursive: true });
  return { from: src, to: dest, copied: ["statusline.mjs", "usage/"] };
}

const dryRun = process.argv.includes("--dry-run");
const hud = hudLauncherPath();
if (!fs.existsSync(hud)) {
  console.error(`FAIL: claude-hud launcher missing: ${hud}`);
  console.error("Install plugin in Claude Code first, then re-run apply. Do not run /claude-hud:setup.");
  process.exit(1);
}

const overlay = copyHudOverlay(dryRun);
const statusLine = desiredStatusLine();
const changes = [{ file: "hud overlay", from: overlay.from, to: overlay.to }];

const settingsFile = settingsPath();
if (!fs.existsSync(settingsFile)) {
  console.error(`FAIL: missing ${settingsFile}`);
  process.exit(1);
}
const live = readJson(settingsFile);
const prevLive = live.statusLine?.command || "";
live.statusLine = statusLine;
if (!live.model) live.model = "haiku";
changes.push({ file: settingsFile, from: prevLive, to: statusLine.command });
if (!dryRun) writeJson(settingsFile, live);

const db = openCcSwitchDb();
if (db) {
  const common = readCommonConfig(db) || {};
  const prevCommon = common.statusLine?.command || "";
  common.statusLine = statusLine;
  changes.push({
    file: "cc-switch settings.common_config_claude",
    from: prevCommon,
    to: statusLine.command,
  });
  if (!dryRun) {
    db.prepare("UPDATE settings SET value = ? WHERE key = 'common_config_claude'").run(
      JSON.stringify(common),
    );
  }

  const providers = db
    .prepare("SELECT id, name, settings_config FROM providers WHERE app_type = 'claude'")
    .all();
  const update = db.prepare("UPDATE providers SET settings_config = ? WHERE id = ?");
  for (const row of providers) {
    let cfg = {};
    try {
      cfg = JSON.parse(row.settings_config || "{}");
    } catch {
      continue;
    }
    if (!cfg.statusLine && row.id === "claude-official") continue;
    const prev = cfg.statusLine?.command || "";
    cfg.statusLine = statusLine;
    if (!cfg.model) cfg.model = "haiku";
    changes.push({
      file: `provider ${row.name}`,
      from: prev,
      to: statusLine.command,
    });
    if (!dryRun) update.run(JSON.stringify(cfg), row.id);
  }
  db.close();
} else {
  changes.push({
    file: "cc-switch.db",
    from: "",
    to: "skipped — db missing; live settings only (will be overwritten on next switch)",
  });
}

console.log(
  JSON.stringify(
    {
      dryRun,
      command: statusLine.command,
      changes: changes.map((c) => ({
        target: c.file,
        from_kind: c.from.includes("statusline.mjs")
          ? "hud"
          : c.from.includes("statusline.js")
            ? "legacy"
            : c.from
              ? "other"
              : "empty",
        to: c.to,
      })),
    },
    null,
    2,
  ),
);
