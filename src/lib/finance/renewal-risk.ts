export interface RenewalRiskInput {
  productAdoptionPct?: number | null;
  ticketVolumePerSeat?: number | null;
  execSponsorStrength?: number | null;
  roiRealizationPct?: number | null;
  paymentDelinquencyPct?: number | null;
}

export type RenewalRiskTier = "low" | "medium" | "high" | "critical";

const toFinite = (value: number | null | undefined, fallback = 0): number =>
  Number.isFinite(value) ? Number(value) : fallback;
const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export function calculateRenewalRiskScore(input: RenewalRiskInput): number {
  const adoptionRisk = 100 - clamp(toFinite(input.productAdoptionPct), 0, 100);
  const supportRisk = clamp(toFinite(input.ticketVolumePerSeat) * 10, 0, 100);
  const sponsorRisk = 100 - clamp(toFinite(input.execSponsorStrength), 0, 100);
  const roiRisk = 100 - clamp(toFinite(input.roiRealizationPct), 0, 100);
  const collectionsRisk = clamp(toFinite(input.paymentDelinquencyPct), 0, 100);

  const weighted =
    adoptionRisk * 0.3 +
    supportRisk * 0.2 +
    sponsorRisk * 0.2 +
    roiRisk * 0.2 +
    collectionsRisk * 0.1;

  return clamp(weighted, 0, 100);
}

export function classifyRenewalRisk(score?: number | null): RenewalRiskTier {
  const normalized = clamp(toFinite(score), 0, 100);
  if (normalized >= 80) return "critical";
  if (normalized >= 60) return "high";
  if (normalized >= 35) return "medium";
  return "low";
}

export function calculateRenewalProbabilities(score?: number | null): {
  renew: number;
  churn: number;
} {
  const normalized = clamp(toFinite(score), 0, 100);
  const churn = clamp(normalized / 100, 0, 1);
  const renew = clamp(1 - churn, 0, 1);
  return { renew, churn };
}

export function buildNrrBridge(params: {
  openingArr?: number | null;
  expansionArr?: number | null;
  contractionArr?: number | null;
  churnedArr?: number | null;
}): { endingArr: number; nrrPct: number } {
  const opening = Math.max(0, toFinite(params.openingArr));
  const expansion = Math.max(0, toFinite(params.expansionArr));
  const contraction = Math.max(0, toFinite(params.contractionArr));
  const churned = Math.max(0, toFinite(params.churnedArr));

  const endingArr = Math.max(0, opening + expansion - contraction - churned);
  const nrrPct = opening > 0 ? clamp((endingArr / opening) * 100, 0, 500) : 0;
  return { endingArr, nrrPct };
}

export function recommendRenewalPlay(score?: number | null): string {
  const tier = classifyRenewalRisk(score);
  switch (tier) {
    case "critical":
      return "Launch executive rescue plan: weekly cadence, commercial restructure, and near-term ROI milestone.";
    case "high":
      return "Deploy 30-day success plan focused on adoption lift and sponsor realignment.";
    case "medium":
      return "Target top usage gaps and secure multi-threaded stakeholder coverage before renewal window.";
    case "low":
      return "Run standard renewal motion and introduce expansion path tied to proven outcomes.";
  }
}
