import {
  formatCompactCurrency,
  formatCurrency,
  formatDelta as formatDeltaGeneric,
  formatNumber as formatNumeric,
  formatPercent,
} from "./finance/formatters";

export function formatUsd(n: number, compact = true): string {
  return compact ? formatCompactCurrency(n, 2) : formatCurrency(n, 0);
}

export function formatPct(n: number, digits = 1): string {
  return formatPercent(n, digits, false);
}

export function formatNumber(n: number, digits = 0): string {
  return formatNumeric(n, digits);
}

export function formatMonths(n: number): string {
  return `${formatNumeric(n, 1)} mo`;
}

export function formatMultiple(n: number): string {
  return `${formatNumeric(n, 2)}×`;
}

export function formatDelta(pct: number): string {
  return formatDeltaGeneric(pct, 1, true);
}

export { formatCurrency, formatCompactCurrency, formatPercent };
