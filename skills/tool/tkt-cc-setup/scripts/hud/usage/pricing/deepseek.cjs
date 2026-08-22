/**
 * DeepSeek 官网按量价（元 / 百万 tokens），用来对照 Coding Plan 是否更省。
 * 来源: https://api-docs.deepseek.com/zh-cn/quick_start/pricing
 * 高峰: 北京时间 9:00–12:00、14:00–18:00；其余为空闲（半价）。
 * 数据时间: 2026-08-17。价变改本表，不要每次刷官网。
 * 映射：cache_read=命中；input+cache_write=未命中；output=输出（含思考）。
 */
const PER_MILLION = {
  flash: {
    off: { hit: 0.05, miss: 1.5, out: 4.5 },
    peak: { hit: 0.1, miss: 3.0, out: 9.0 },
  },
  pro: {
    off: { hit: 0.15, miss: 4.5, out: 13.5 },
    peak: { hit: 0.3, miss: 9.0, out: 27.0 },
  },
};

function resolveFamily(model) {
  const id = String(model || "").toLowerCase();
  if (/v4-pro|deepseek-v4-pro/.test(id)) return "pro";
  if (/v4-flash|deepseek-v4-flash|flash-vision/.test(id)) return "flash";
  return null;
}

function shanghaiHour(iso) {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return 0;
  const text = d.toLocaleString("en-GB", {
    timeZone: "Asia/Shanghai",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const [h, m] = text.split(":").map(Number);
  return h + (m || 0) / 60;
}

function isPeak(iso) {
  const h = shanghaiHour(iso);
  return (h >= 9 && h < 12) || (h >= 14 && h < 18);
}

function rate(family, iso) {
  const row = PER_MILLION[family];
  if (!row) return null;
  return isPeak(iso) ? row.peak : row.off;
}

function tokensToCny(tokens, yuanPerMillion) {
  return (tokens * yuanPerMillion) / 1_000_000;
}

function priceUsage(family, usage, iso) {
  const r = rate(family, iso);
  if (!r) return 0;
  const miss = (usage.input || 0) + (usage.cacheWrite || 0);
  const hit = usage.cacheRead || 0;
  const out = usage.output || 0;
  return tokensToCny(miss, r.miss) + tokensToCny(hit, r.hit) + tokensToCny(out, r.out);
}

module.exports = {
  source: "deepseek-official-2026-08-17",
  resolveFamily,
  isPeak,
  priceUsage,
};
