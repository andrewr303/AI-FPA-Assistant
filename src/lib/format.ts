export function formatUsd(n: number, compact = true): string {
  if (!isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (compact) {
    if (abs >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
    if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
    if (abs >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  }
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function formatPct(n: number, digits = 1): string {
  if (!isFinite(n)) return "—";
  return `${n.toFixed(digits)}%`;
}

export function formatNumber(n: number, digits = 0): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: digits });
}

export function formatMonths(n: number): string {
  return `${n.toFixed(1)} mo`;
}

export function formatMultiple(n: number): string {
  return `${n.toFixed(2)}×`;
}

export function formatDelta(pct: number): string {
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}
