/**
 * 火山方舟 Coding Plan 用量。依赖本机 arkcli（plans get / usage plan）。
 * 参考 coding-plan-balance.js；HUD 只输出一行。
 */
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const { cached } = require("../cache.cjs");

const LABEL_CN = { session: "5h", weekly: "周", monthly: "月" };

function fmtPercent(value) {
  const pct = Number(value);
  if (!Number.isFinite(pct)) return "?%";
  if (pct >= 10) return `${pct.toFixed(1)}%`;
  return `${pct.toFixed(2)}%`;
}

function match(baseUrl) {
  return /volces\.com|volcengine|ark\.cn-beijing/i.test(baseUrl || "");
}

function resolveArkcli() {
  if (process.env.ARKCLI_BIN && fs.existsSync(process.env.ARKCLI_BIN)) {
    return process.env.ARKCLI_BIN;
  }
  let nodeDir = path.dirname(process.execPath);
  try {
    nodeDir = fs.realpathSync(nodeDir);
  } catch {
    /* keep */
  }
  for (const name of ["arkcli.cmd", "arkcli.exe", "arkcli"]) {
    const candidate = path.join(nodeDir, name);
    if (fs.existsSync(candidate)) return candidate;
  }
  return "arkcli";
}

function runArkcli(args) {
  const bin = resolveArkcli();
  const opts = {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 4000,
    windowsHide: true,
  };
  const out = bin.toLowerCase().endsWith(".cmd")
    ? execFileSync(bin, args, { ...opts, shell: true })
    : execFileSync(bin, args, opts);
  return JSON.parse(out);
}

function fmtTime(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fetchLineFresh() {
  const planData = runArkcli(["plans", "get"]);
  const plan = (planData.plans || []).find((x) => x.key === "coding-plan");
  if (!plan) return null;
  const usageData = runArkcli(["usage", "plan", "--product", "coding-plan"]);
  const item = (usageData.items || []).find((x) => x.product === "coding-plan");
  if (!item) return null;

  const tier = plan.tier || "?";
  const periods = (item.periods || []).map((p) => ({
    period: p.label,
    label: LABEL_CN[p.label] || p.label,
    percent: p.percent,
    reset_at: p.reset_at,
  }));
  if (!periods.length) return null;
  const bottleneck = periods.reduce((a, b) => (a.percent > b.percent ? a : b));
  const cells = periods
    .map((p) => {
      const warn = p.period === bottleneck.period ? "⚠" : "";
      return `${warn}${p.label} ${fmtPercent(p.percent)}`;
    })
    .join("  ");
  return `火山 ${String(tier).toUpperCase()}  ${cells}  →${fmtTime(bottleneck.reset_at)}`;
}

function fetchLine() {
  try {
    return cached("volcengine", fetchLineFresh);
  } catch {
    return null;
  }
}

module.exports = { id: "volcengine", match, fetchLine };
