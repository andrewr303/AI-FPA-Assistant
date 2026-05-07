const toFinite = (value: number | null | undefined, fallback = 0): number =>
  Number.isFinite(value) ? Number(value) : fallback;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export function formatCurrency(value?: number | null, maximumFractionDigits = 0): string {
  const n = toFinite(value, NaN);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits,
  });
}

export function formatCompactCurrency(value?: number | null, digits = 1): string {
  const n = toFinite(value, NaN);
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(digits)}B`;
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(digits)}M`;
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(digits)}K`;
  return formatCurrency(n, 0);
}

export function formatPercent(value?: number | null, digits = 1, clampRange = true): string {
  const n = toFinite(value, NaN);
  if (!Number.isFinite(n)) return "—";
  const out = clampRange ? clamp(n, -100, 100) : n;
  return `${out.toFixed(digits)}%`;
}

export function formatNumber(value?: number | null, digits = 0): string {
  const n = toFinite(value, NaN);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US", { maximumFractionDigits: digits });
}

export function formatBps(value?: number | null, digits = 0): string {
  const n = toFinite(value, NaN);
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(digits)} bps`;
}

export function formatDelta(value?: number | null, digits = 1, isPercent = true): string {
  const n = toFinite(value, NaN);
  if (!Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return isPercent ? `${sign}${n.toFixed(digits)}%` : `${sign}${n.toFixed(digits)}`;
}
