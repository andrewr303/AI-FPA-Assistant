export interface WorkflowModelCostInput {
  monthlyRuns?: number | null;
  avgInputTokens?: number | null;
  avgOutputTokens?: number | null;
  inputCostPer1k?: number | null;
  outputCostPer1k?: number | null;
  overheadPct?: number | null;
}

export interface WorkflowModelCostResult {
  monthlyCost: number;
  annualCost: number;
  perRunCost: number;
}

export interface FrontierPoint {
  model: string;
  qualityScore: number;
  latencyMs: number;
  costPerRun: number;
}

export interface CanaryPlan {
  stages: Array<{ name: string; trafficPct: number; successThresholdPct: number }>;
  rollbackTrigger: string;
}

const toFinite = (value: number | null | undefined, fallback = 0): number =>
  Number.isFinite(value) ? Number(value) : fallback;
const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export function calculateWorkflowModelCost(input: WorkflowModelCostInput): WorkflowModelCostResult {
  const runs = Math.max(0, toFinite(input.monthlyRuns));
  const inTokens = Math.max(0, toFinite(input.avgInputTokens));
  const outTokens = Math.max(0, toFinite(input.avgOutputTokens));
  const inRate = Math.max(0, toFinite(input.inputCostPer1k));
  const outRate = Math.max(0, toFinite(input.outputCostPer1k));
  const overhead = clamp(toFinite(input.overheadPct), 0, 100);

  const perRunBase = (inTokens / 1000) * inRate + (outTokens / 1000) * outRate;
  const perRunCost = perRunBase * (1 + overhead / 100);
  const monthlyCost = perRunCost * runs;

  return { perRunCost, monthlyCost, annualCost: monthlyCost * 12 };
}

export function identifyParetoFrontier(points: FrontierPoint[]): FrontierPoint[] {
  return points.filter(
    (candidate) =>
      !points.some(
        (other) =>
          other.model !== candidate.model &&
          other.qualityScore >= candidate.qualityScore &&
          other.latencyMs <= candidate.latencyMs &&
          other.costPerRun <= candidate.costPerRun &&
          (other.qualityScore > candidate.qualityScore ||
            other.latencyMs < candidate.latencyMs ||
            other.costPerRun < candidate.costPerRun),
      ),
  );
}

export function recommendModelRoute(points: FrontierPoint[]): string {
  const frontier = identifyParetoFrontier(points);
  if (!frontier.length)
    return "No viable model set; collect latency, quality, and cost telemetry first.";

  const cheapest = frontier.reduce((best, p) => (p.costPerRun < best.costPerRun ? p : best));
  const bestQuality = frontier.reduce((best, p) => (p.qualityScore > best.qualityScore ? p : best));

  if (cheapest.model === bestQuality.model) {
    return `Standardize on ${cheapest.model}; it leads both quality and cost on the current frontier.`;
  }

  return `Route baseline traffic to ${cheapest.model} and escalate complex workloads to ${bestQuality.model}.`;
}

export function calculateAnnualSavings(
  currentAnnualCost?: number | null,
  projectedAnnualCost?: number | null,
): { savings: number; savingsPct: number } {
  const current = Math.max(0, toFinite(currentAnnualCost));
  const projected = Math.max(0, toFinite(projectedAnnualCost));
  const savings = current - projected;
  const savingsPct = current > 0 ? clamp((savings / current) * 100, -100, 100) : 0;
  return { savings, savingsPct };
}

export function buildCanaryPlan(riskScore?: number | null): CanaryPlan {
  const risk = clamp(toFinite(riskScore), 0, 100);
  const cautious = risk >= 70;

  return {
    stages: cautious
      ? [
          { name: "Internal", trafficPct: 1, successThresholdPct: 98 },
          { name: "Pilot", trafficPct: 5, successThresholdPct: 97 },
          { name: "Ramp", trafficPct: 20, successThresholdPct: 96 },
          { name: "General", trafficPct: 100, successThresholdPct: 95 },
        ]
      : [
          { name: "Internal", trafficPct: 5, successThresholdPct: 97 },
          { name: "Pilot", trafficPct: 20, successThresholdPct: 96 },
          { name: "Ramp", trafficPct: 50, successThresholdPct: 95 },
          { name: "General", trafficPct: 100, successThresholdPct: 94 },
        ],
    rollbackTrigger:
      "Rollback if error rate increases >2pp or quality score drops >3pp versus control.",
  };
}
