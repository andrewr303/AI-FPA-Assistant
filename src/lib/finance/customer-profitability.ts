export type MarginTier = "critical" | "low" | "healthy" | "high";

export interface CustomerProfitabilityInput {
  arr?: number | null;
  cogs?: number | null;
  serviceCost?: number | null;
  supportCost?: number | null;
  discountRatePct?: number | null;
}

export interface CustomerProfitabilityResult {
  revenue: number;
  totalCost: number;
  grossProfit: number;
  grossMarginPct: number;
}

export interface CostWaterfallStep {
  label: string;
  amount: number;
  runningTotal: number;
}

const toFinite = (value: number | null | undefined, fallback = 0): number =>
  Number.isFinite(value) ? Number(value) : fallback;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export function calculateCustomerProfitability(
  input: CustomerProfitabilityInput,
): CustomerProfitabilityResult {
  const baseRevenue = Math.max(0, toFinite(input.arr));
  const discountRatePct = clamp(toFinite(input.discountRatePct), 0, 100);
  const revenue = baseRevenue * (1 - discountRatePct / 100);

  const totalCost =
    Math.max(0, toFinite(input.cogs)) +
    Math.max(0, toFinite(input.serviceCost)) +
    Math.max(0, toFinite(input.supportCost));

  const grossProfit = revenue - totalCost;
  const grossMarginPct = revenue > 0 ? clamp((grossProfit / revenue) * 100, -100, 100) : 0;

  return {
    revenue,
    totalCost,
    grossProfit,
    grossMarginPct,
  };
}

export function classifyMarginTier(marginPct?: number | null): MarginTier {
  const margin = clamp(toFinite(marginPct), -100, 100);
  if (margin < 0) return "critical";
  if (margin < 20) return "low";
  if (margin < 50) return "healthy";
  return "high";
}

export function recommendMarginPlay(marginPct?: number | null): string {
  const tier = classifyMarginTier(marginPct);
  switch (tier) {
    case "critical":
      return "Reprice immediately and scope services to remove negative-margin delivery.";
    case "low":
      return "Bundle value-add features and tighten support entitlements to lift gross margin.";
    case "healthy":
      return "Protect pricing power and test selective upsell motions for expansion.";
    case "high":
      return "Scale acquisition in similar segments and invest in retention to compound margin.";
  }
}

export function buildCustomerCostWaterfall(input: CustomerProfitabilityInput): CostWaterfallStep[] {
  const revenue = Math.max(0, toFinite(input.arr));
  const discount = revenue * (clamp(toFinite(input.discountRatePct), 0, 100) / 100);
  const cogs = Math.max(0, toFinite(input.cogs));
  const service = Math.max(0, toFinite(input.serviceCost));
  const support = Math.max(0, toFinite(input.supportCost));

  let runningTotal = revenue;
  const pushStep = (label: string, amount: number): CostWaterfallStep => {
    runningTotal += amount;
    return { label, amount, runningTotal };
  };

  return [
    { label: "List ARR", amount: revenue, runningTotal: revenue },
    pushStep("Discounts", -discount),
    pushStep("COGS", -cogs),
    pushStep("Service delivery", -service),
    pushStep("Support", -support),
  ];
}
