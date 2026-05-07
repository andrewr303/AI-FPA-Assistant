// Mock data layer — single source of truth for the Nooks FP&A demo.
// Calibrated to Nooks's public footprint (~$210M ARR Apr 2026, ~200 FTE,
// AI Sequencing launched Feb 2026).

export type Segment = "enterprise" | "mid_market" | "smb";
export type ProductCode = "dialer" | "coaching" | "prospecting" | "sequencing" | "numbers";
export type Severity = "info" | "warn" | "critical";

export const products = [
  {
    code: "dialer" as const,
    name: "AI Dialer",
    tagline: "Skip the noise. Connect with 3× more prospects.",
    gm: 0.78,
    cogsPerAction: 0.012,
  },
  {
    code: "coaching" as const,
    name: "AI Coaching",
    tagline: "Level up reps with AI-powered coaching.",
    gm: 0.71,
    cogsPerAction: 0.018,
  },
  {
    code: "prospecting" as const,
    name: "Signals & Intelligence",
    tagline: "The insight engine for your GTM motion.",
    gm: 0.62,
    cogsPerAction: 0.024,
  },
  {
    code: "sequencing" as const,
    name: "AI Sequencing",
    tagline: "Multi-channel engagement with AI agents.",
    gm: 0.54,
    cogsPerAction: 0.041,
  },
  {
    code: "numbers" as const,
    name: "Nooks Numbers",
    tagline: "Get more mobile numbers to dial.",
    gm: 0.83,
    cogsPerAction: 0.005,
  },
];

export const vendors = [
  {
    name: "openai",
    display: "OpenAI",
    status: "active",
    committedSpend: 2_400_000,
    discount: 22,
    tier: "enterprise",
  },
  {
    name: "anthropic",
    display: "Anthropic",
    status: "active",
    committedSpend: 1_800_000,
    discount: 18,
    tier: "enterprise",
  },
  {
    name: "google",
    display: "Google (Gemini)",
    status: "pilot",
    committedSpend: 250_000,
    discount: 10,
    tier: "standard",
  },
  {
    name: "deepseek",
    display: "DeepSeek",
    status: "pilot",
    committedSpend: 50_000,
    discount: 0,
    tier: "standard",
  },
];

export type Model = {
  vendor: string;
  modelName: string;
  contextWindow: number;
  inputPrice: number; // per 1M tokens
  cachedInputPrice: number;
  outputPrice: number;
  quality: number;
};

export const models: Model[] = [
  {
    vendor: "openai",
    modelName: "gpt-5",
    contextWindow: 400_000,
    inputPrice: 1.25,
    cachedInputPrice: 0.13,
    outputPrice: 10.0,
    quality: 92.0,
  },
  {
    vendor: "openai",
    modelName: "gpt-5-mini",
    contextWindow: 400_000,
    inputPrice: 0.25,
    cachedInputPrice: 0.03,
    outputPrice: 2.0,
    quality: 85.5,
  },
  {
    vendor: "openai",
    modelName: "gpt-5-nano",
    contextWindow: 400_000,
    inputPrice: 0.05,
    cachedInputPrice: 0.005,
    outputPrice: 0.4,
    quality: 74.0,
  },
  {
    vendor: "openai",
    modelName: "gpt-4.1",
    contextWindow: 1_000_000,
    inputPrice: 2.0,
    cachedInputPrice: 0.5,
    outputPrice: 8.0,
    quality: 90.0,
  },
  {
    vendor: "anthropic",
    modelName: "claude-opus-4.7",
    contextWindow: 200_000,
    inputPrice: 5.0,
    cachedInputPrice: 0.5,
    outputPrice: 25.0,
    quality: 94.5,
  },
  {
    vendor: "anthropic",
    modelName: "claude-sonnet-4.6",
    contextWindow: 200_000,
    inputPrice: 3.0,
    cachedInputPrice: 0.3,
    outputPrice: 15.0,
    quality: 91.0,
  },
  {
    vendor: "anthropic",
    modelName: "claude-haiku-4.5",
    contextWindow: 200_000,
    inputPrice: 1.0,
    cachedInputPrice: 0.1,
    outputPrice: 5.0,
    quality: 82.0,
  },
  {
    vendor: "google",
    modelName: "gemini-3-pro",
    contextWindow: 1_000_000,
    inputPrice: 2.0,
    cachedInputPrice: 0.5,
    outputPrice: 12.0,
    quality: 90.5,
  },
  {
    vendor: "google",
    modelName: "gemini-3-flash",
    contextWindow: 1_000_000,
    inputPrice: 0.5,
    cachedInputPrice: 0.05,
    outputPrice: 3.0,
    quality: 84.0,
  },
  {
    vendor: "deepseek",
    modelName: "deepseek-v3.2",
    contextWindow: 128_000,
    inputPrice: 0.28,
    cachedInputPrice: 0.028,
    outputPrice: 0.42,
    quality: 81.0,
  },
];

export const customers = [
  {
    name: "HubSpot",
    emoji: "🟧",
    segment: "enterprise" as const,
    region: "NAMER",
    industry: "MarTech",
    seats: 280,
    signup: "2023-06-12",
  },
  {
    name: "Rippling",
    emoji: "🟦",
    segment: "enterprise" as const,
    region: "NAMER",
    industry: "HRTech",
    seats: 220,
    signup: "2023-09-03",
  },
  {
    name: "ZoomInfo",
    emoji: "🟪",
    segment: "enterprise" as const,
    region: "NAMER",
    industry: "Data",
    seats: 195,
    signup: "2024-01-22",
  },
  {
    name: "Deel",
    emoji: "🟩",
    segment: "enterprise" as const,
    region: "NAMER",
    industry: "HRTech",
    seats: 340,
    signup: "2024-02-14",
  },
  {
    name: "Modern Health",
    emoji: "🟦",
    segment: "mid_market" as const,
    region: "NAMER",
    industry: "HealthTech",
    seats: 85,
    signup: "2023-11-08",
  },
  {
    name: "Seismic",
    emoji: "🟧",
    segment: "enterprise" as const,
    region: "NAMER",
    industry: "SalesTech",
    seats: 160,
    signup: "2024-03-19",
  },
  {
    name: "Greenhouse",
    emoji: "🟩",
    segment: "mid_market" as const,
    region: "NAMER",
    industry: "HRTech",
    seats: 72,
    signup: "2024-04-02",
  },
  {
    name: "Drata",
    emoji: "🟪",
    segment: "mid_market" as const,
    region: "NAMER",
    industry: "Compliance",
    seats: 64,
    signup: "2024-05-17",
  },
  {
    name: "Vanta",
    emoji: "🟦",
    segment: "mid_market" as const,
    region: "NAMER",
    industry: "Compliance",
    seats: 78,
    signup: "2024-06-21",
  },
  {
    name: "Cursor",
    emoji: "⬛",
    segment: "mid_market" as const,
    region: "NAMER",
    industry: "DevTools",
    seats: 45,
    signup: "2024-08-08",
  },
  {
    name: "Pendo",
    emoji: "🟧",
    segment: "mid_market" as const,
    region: "NAMER",
    industry: "Analytics",
    seats: 58,
    signup: "2024-09-12",
  },
  {
    name: "Coder",
    emoji: "🟪",
    segment: "mid_market" as const,
    region: "NAMER",
    industry: "DevTools",
    seats: 52,
    signup: "2024-10-04",
  },
  {
    name: "Klue",
    emoji: "🟦",
    segment: "smb" as const,
    region: "NAMER",
    industry: "CompIntel",
    seats: 28,
    signup: "2024-11-19",
  },
  {
    name: "Observe",
    emoji: "🟩",
    segment: "smb" as const,
    region: "NAMER",
    industry: "Observability",
    seats: 22,
    signup: "2024-12-02",
  },
  {
    name: "Udemy",
    emoji: "🟪",
    segment: "enterprise" as const,
    region: "NAMER",
    industry: "Education",
    seats: 240,
    signup: "2025-02-15",
  },
  {
    name: "Toast",
    emoji: "🟧",
    segment: "enterprise" as const,
    region: "NAMER",
    industry: "Restaurant",
    seats: 175,
    signup: "2025-03-22",
  },
  {
    name: "Postman",
    emoji: "🟧",
    segment: "mid_market" as const,
    region: "NAMER",
    industry: "DevTools",
    seats: 68,
    signup: "2025-05-04",
  },
  {
    name: "Airtable",
    emoji: "🟦",
    segment: "mid_market" as const,
    region: "NAMER",
    industry: "Productivity",
    seats: 95,
    signup: "2025-06-18",
  },
  {
    name: "Mimecast",
    emoji: "🟪",
    segment: "enterprise" as const,
    region: "EMEA",
    industry: "Security",
    seats: 130,
    signup: "2025-08-01",
  },
  {
    name: "Verkada",
    emoji: "🟦",
    segment: "mid_market" as const,
    region: "NAMER",
    industry: "Security",
    seats: 82,
    signup: "2025-09-14",
  },
  {
    name: "Fivetran",
    emoji: "🟧",
    segment: "mid_market" as const,
    region: "NAMER",
    industry: "Data",
    seats: 60,
    signup: "2025-10-27",
  },
  {
    name: "Amplitude",
    emoji: "🟪",
    segment: "mid_market" as const,
    region: "NAMER",
    industry: "Analytics",
    seats: 70,
    signup: "2025-11-30",
  },
  {
    name: "ClickUp",
    emoji: "🟦",
    segment: "mid_market" as const,
    region: "NAMER",
    industry: "Productivity",
    seats: 50,
    signup: "2026-01-12",
  },
  {
    name: "Relay",
    emoji: "🟩",
    segment: "smb" as const,
    region: "NAMER",
    industry: "Workflow",
    seats: 24,
    signup: "2026-02-20",
  },
  {
    name: "Linear",
    emoji: "🟪",
    segment: "smb" as const,
    region: "NAMER",
    industry: "DevTools",
    seats: 26,
    signup: "2026-03-15",
  },
];

// ===== KPI snapshots (12 months) =====
const months = Array.from({ length: 12 }, (_, i) => {
  const d = new Date(2025, 4 + i, 1);
  return d.toISOString().slice(0, 10);
});

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}
const rand = seeded(42);

export const arrSeries = months.map((m, i) => ({
  month: m,
  value: Math.round(52_000_000 * Math.pow(1.135, i)),
}));

export const nrrSeries = months.map((m) => ({
  month: m,
  value: +(118 + (rand() * 8 - 4)).toFixed(1),
}));
export const grrSeries = months.map((m) => ({
  month: m,
  value: +(91 + (rand() * 4 - 2)).toFixed(1),
}));
export const gmSeries = months.map((m, i) => ({
  month: m,
  value: +(64 - i * 0.22 + (rand() * 2 - 1)).toFixed(1),
}));
export const burnSeries = months.map((m) => ({
  month: m,
  value: Math.round(3_800_000 + (rand() * 600_000 - 300_000)),
}));
export const magicSeries = months.map((m) => ({
  month: m,
  value: +(1.15 + (rand() * 0.4 - 0.2)).toFixed(2),
}));
export const cacPaybackSeries = months.map((m, i) => ({
  month: m,
  value: +(11 + i * 0.15 + (rand() * 1.5 - 0.75)).toFixed(1),
}));
export const ruleOf40Series = months.map((m) => ({
  month: m,
  value: +(48 + (rand() * 8 - 4)).toFixed(1),
}));
export const headcountSeries = months.map((m, i) => ({ month: m, value: Math.round(90 + i * 9) }));
export const llmCogsSeries = months.map((m, i) => ({
  month: m,
  value: Math.round(450_000 * Math.pow(1.24, i)),
}));

export const kpis = {
  arr: arrSeries,
  nrr: nrrSeries,
  grr: grrSeries,
  gm: gmSeries,
  burn: burnSeries,
  magic_number: magicSeries,
  cac_payback: cacPaybackSeries,
  rule_of_40: ruleOf40Series,
  headcount: headcountSeries,
  llm_cogs: llmCogsSeries,
};

export const alerts = [
  {
    id: 1,
    severity: "critical" as Severity,
    metric: "llm_cogs",
    title: "Sequencing COGS blew through plan",
    message:
      "AI Sequencing inference cost ran 42% over plan in March. Driver: Opus 4.7 tokenizer change adds ~35% tokens on coding-agent flows. Consider rolling Sonnet 4.6 mix up to 60%.",
    threshold: 1_700_000,
    actual: 2_410_000,
    triggeredAt: "2026-04-02",
  },
  {
    id: 2,
    severity: "warn" as Severity,
    metric: "cac_payback",
    title: "CAC payback drifted past 12 months",
    message:
      "Mid-market CAC payback hit 13.4 months — first time above 12 since Series B. Driver: longer ramp on Seattle AE cohort.",
    threshold: 12,
    actual: 13.4,
    triggeredAt: "2026-04-05",
  },
  {
    id: 3,
    severity: "warn" as Severity,
    metric: "gm",
    title: "Blended gross margin under 65% target",
    message: "Q1 GM landed at 61% — Sequencing now 22% of revenue at 54% GM, dragging blend.",
    threshold: 65,
    actual: 61,
    triggeredAt: "2026-04-08",
  },
  {
    id: 4,
    severity: "info" as Severity,
    metric: "arr",
    title: "ARR crossed $210M run-rate",
    message: "6× since Series B confirmed. Public Dan-Lee-shareable number.",
    threshold: 200_000_000,
    actual: 210_400_000,
    triggeredAt: "2026-04-12",
  },
  {
    id: 5,
    severity: "critical" as Severity,
    metric: "llm_cogs",
    title: "HubSpot action burn alert",
    message:
      "HubSpot used 2,140 actions/seat in March vs 1,500 cap — overage revenue $52K, but cost-to-serve $74K. Net: -$22K on the overage.",
    threshold: 1500,
    actual: 2140,
    triggeredAt: "2026-04-15",
  },
  {
    id: 6,
    severity: "warn" as Severity,
    metric: null,
    title: "Vendor concentration risk",
    message:
      "OpenAI now 64% of inference COGS. Crossing the 60% concentration threshold set in the Series B board deck.",
    threshold: 60,
    actual: 64,
    triggeredAt: "2026-04-18",
  },
];

export const varianceRecords = [
  {
    period: "2026-01",
    lineItem: "new_arr",
    segment: "enterprise" as const,
    actual: 3_200_000,
    plan: 2_800_000,
    notes: "2 unplanned 7-figure logos closed (Toast expansion + Mimecast new)",
  },
  {
    period: "2026-01",
    lineItem: "llm_cogs",
    segment: null,
    actual: 1_620_000,
    plan: 1_400_000,
    notes: "AI Sequencing beta cohort 3.4× modeled token usage",
  },
  {
    period: "2026-01",
    lineItem: "expansion",
    segment: "mid_market" as const,
    actual: 1_480_000,
    plan: 1_200_000,
    notes: "Sequencing attach in mid-market beat plan by 28%",
  },
  {
    period: "2026-02",
    lineItem: "new_arr",
    segment: "enterprise" as const,
    actual: 3_850_000,
    plan: 3_100_000,
    notes: "AI Sequencing GA pulled forward two enterprise deals",
  },
  {
    period: "2026-02",
    lineItem: "llm_cogs",
    segment: null,
    actual: 2_280_000,
    plan: 1_550_000,
    notes: "GA launch traffic + Opus 4.7 tokenizer +35% on coding agent paths",
  },
  {
    period: "2026-02",
    lineItem: "churn",
    segment: "smb" as const,
    actual: 410_000,
    plan: 280_000,
    notes: "2 SMB customers off-boarded after pricing cap conversations",
  },
  {
    period: "2026-03",
    lineItem: "new_arr",
    segment: "enterprise" as const,
    actual: 4_100_000,
    plan: 3_400_000,
    notes: "Three enterprise logos at $750K+ ACV each",
  },
  {
    period: "2026-03",
    lineItem: "expansion",
    segment: "enterprise" as const,
    actual: 1_850_000,
    plan: 1_900_000,
    notes: "Slight miss — Coaching attach lower than modeled",
  },
  {
    period: "2026-03",
    lineItem: "llm_cogs",
    segment: null,
    actual: 2_410_000,
    plan: 1_700_000,
    notes: "Sequencing hybrid pricing cap overages started landing — under-modeled",
  },
  {
    period: "2026-03",
    lineItem: "salaries",
    segment: null,
    actual: 4_520_000,
    plan: 4_380_000,
    notes: "Seattle eng push hired ahead of plan",
  },
];

export type CustomerProfitabilityInput = {
  customerName: string;
  customerSuccessCostMonthly: number;
  infrastructureAllocationMonthly: number;
  profitabilityOverridePct: number;
};

export type CustomerUsageHistory = {
  customerName: string;
  product: ProductCode;
  month: string;
  actions: number;
};

export const customerProfitabilityInputs: CustomerProfitabilityInput[] = customers.map((c, i) => ({
  customerName: c.name,
  customerSuccessCostMonthly: Math.round(1800 + c.seats * 48 + (i % 5) * 350),
  infrastructureAllocationMonthly: Math.round(2200 + c.seats * 38 + (i % 7) * 420),
  profitabilityOverridePct: ["HubSpot", "Deel", "Toast"].includes(c.name)
    ? -8.5
    : i % 6 === 0
      ? -2.5
      : 0,
}));

const usageMonths = ["2025-11", "2025-12", "2026-01", "2026-02", "2026-03", "2026-04"];
export const customerUsageHistory: CustomerUsageHistory[] = customers.flatMap((c, cix) =>
  usageMonths.flatMap((month, mix) =>
    products.map((p, pix) => ({
      customerName: c.name,
      product: p.code,
      month,
      actions: Math.round(
        c.seats * (38 + pix * 17 + mix * 3) * (1 + ((cix + pix + mix) % 4) * 0.06),
      ),
    })),
  ),
);

export type FinOpsWorkflow = {
  workflowId: string;
  name: string;
  owner: string;
  baselineModel: string;
};

export type FinOpsModelCandidate = {
  workflowId: string;
  vendor: string;
  modelName: string;
  qualityScore: number;
  p95LatencyMs: number;
  currentRoutingSharePct: number;
  candidateRoutingSharePct: number;
};

export const finOpsWorkflows: FinOpsWorkflow[] = [
  {
    workflowId: "wf_reply_assist",
    name: "Reply Assist",
    owner: "RevOps AI",
    baselineModel: "gpt-5",
  },
  {
    workflowId: "wf_sequence_writer",
    name: "Sequence Writer",
    owner: "Growth AI",
    baselineModel: "claude-sonnet-4.6",
  },
  {
    workflowId: "wf_call_summary",
    name: "Call Summary",
    owner: "Core Product",
    baselineModel: "gpt-4.1",
  },
  {
    workflowId: "wf_objection_coach",
    name: "Objection Coach",
    owner: "Enablement",
    baselineModel: "claude-opus-4.7",
  },
  {
    workflowId: "wf_lead_scoring",
    name: "Lead Scoring",
    owner: "Data Platform",
    baselineModel: "gemini-3-pro",
  },
  {
    workflowId: "wf_signal_enrichment",
    name: "Signal Enrichment",
    owner: "Data Platform",
    baselineModel: "gpt-5-mini",
  },
  {
    workflowId: "wf_playbook_qa",
    name: "Playbook Q&A",
    owner: "Support AI",
    baselineModel: "claude-haiku-4.5",
  },
];

const candidateModelNames = [
  "gpt-5",
  "gpt-5-mini",
  "gpt-5-nano",
  "gpt-4.1",
  "claude-opus-4.7",
  "claude-sonnet-4.6",
  "gemini-3-pro",
  "deepseek-v3.2",
];

export const finOpsModelCandidates: FinOpsModelCandidate[] = finOpsWorkflows.flatMap((wf, wix) =>
  candidateModelNames.map((name, ix) => {
    const model = models.find((m) => m.modelName === name)!;
    return {
      workflowId: wf.workflowId,
      vendor: model.vendor,
      modelName: model.modelName,
      qualityScore: +(model.quality - (ix % 3) * 1.1 + (wix % 2) * 0.6).toFixed(1),
      p95LatencyMs: 720 + ix * 120 + wix * 35,
      currentRoutingSharePct: ix === 0 ? 55 : ix === 1 ? 25 : ix === 2 ? 12 : ix === 3 ? 8 : 0,
      candidateRoutingSharePct:
        ix === 0
          ? 32
          : ix === 1
            ? 30
            : ix === 2
              ? 15
              : ix === 3
                ? 8
                : ix === 5
                  ? 10
                  : ix === 6
                    ? 5
                    : 0,
    };
  }),
);

export const finOpsRecommendations = [
  {
    workflowId: "wf_reply_assist",
    recommendation: "Shift 23% routing from gpt-5 to gpt-5-mini for low-complexity prompts.",
    estimatedMonthlySavings: 86_000,
  },
  {
    workflowId: "wf_objection_coach",
    recommendation: "Route first-pass drafts to claude-sonnet-4.6 and escalate only 18% to opus.",
    estimatedMonthlySavings: 74_500,
  },
  {
    workflowId: "wf_signal_enrichment",
    recommendation: "Move background enrichment batch jobs to deepseek-v3.2 overnight queues.",
    estimatedMonthlySavings: 41_300,
  },
];

export type RenewalHealthSignal = {
  customerName: string;
  month: string;
  usageCoveragePct: number;
  execSponsorScore: number;
  supportBurdenScore: number;
  paymentTimelinessScore: number;
};

export type RenewalPrediction = {
  customerName: string;
  renewalMonth: string;
  riskScore: number;
  riskBand: "healthy" | "watch" | "high" | "critical";
  predictedRenewalPct: number;
};

export const renewalHealthSignals: RenewalHealthSignal[] = customers.flatMap((c, idx) =>
  usageMonths.map((month, mix) => ({
    customerName: c.name,
    month,
    usageCoveragePct: Math.max(42, Math.min(98, 78 + (idx % 5) * 4 - mix * 2)),
    execSponsorScore: Math.max(35, Math.min(96, 74 + (idx % 7) * 3 - mix)),
    supportBurdenScore: Math.max(22, Math.min(95, 36 + (idx % 6) * 7 + mix * 2)),
    paymentTimelinessScore: Math.max(40, Math.min(99, 88 - (idx % 4) * 6 - mix)),
  })),
);

const forcedRiskBands: Record<string, RenewalPrediction["riskBand"]> = {
  HubSpot: "watch",
  Deel: "high",
  Toast: "high",
  Vanta: "watch",
  Relay: "watch",
  Linear: "critical",
};

export const renewalPredictions: RenewalPrediction[] = customers.map((c, idx) => {
  const riskBand = forcedRiskBands[c.name] ?? (idx % 9 === 0 ? "watch" : "healthy");
  const riskScore =
    riskBand === "critical" ? 92 : riskBand === "high" ? 76 : riskBand === "watch" ? 58 : 24;
  return {
    customerName: c.name,
    renewalMonth: "2026-07",
    riskScore,
    riskBand,
    predictedRenewalPct:
      riskBand === "critical" ? 42 : riskBand === "high" ? 63 : riskBand === "watch" ? 79 : 93,
  };
});

// ARR waterfall for Q1 2026
export const arrWaterfall = [
  { label: "Starting ARR", value: 180_000_000, type: "start" as const },
  { label: "New logos", value: 14_500_000, type: "up" as const },
  { label: "Expansion", value: 9_200_000, type: "up" as const },
  { label: "Contraction", value: -2_100_000, type: "down" as const },
  { label: "Churn", value: -3_800_000, type: "down" as const },
  { label: "Sequencing overage", value: 12_600_000, type: "up" as const },
  { label: "Ending ARR", value: 210_400_000, type: "end" as const },
];

export const arrByProduct = [
  { product: "AI Dialer", arr: 84_000_000, gm: 78 },
  { product: "AI Coaching", arr: 32_000_000, gm: 71 },
  { product: "Signals & Intelligence", arr: 24_000_000, gm: 62 },
  { product: "AI Sequencing", arr: 46_000_000, gm: 54 },
  { product: "Nooks Numbers", arr: 24_400_000, gm: 83 },
];

export const vendorMixCurrent = [
  { vendor: "OpenAI", share: 64, cogs: 1_542_400 },
  { vendor: "Anthropic", share: 28, cogs: 674_800 },
  { vendor: "Google", share: 6, cogs: 144_600 },
  { vendor: "DeepSeek", share: 2, cogs: 48_200 },
];

export const forecastHistory = [
  { period: "2025-11", lineItem: "new_arr", forecast: 3_200_000, actual: 3_580_000, missPct: 11.9 },
  {
    period: "2025-11",
    lineItem: "llm_cogs",
    forecast: 1_100_000,
    actual: 1_240_000,
    missPct: 12.7,
  },
  { period: "2025-12", lineItem: "new_arr", forecast: 3_450_000, actual: 3_780_000, missPct: 9.6 },
  {
    period: "2025-12",
    lineItem: "llm_cogs",
    forecast: 1_180_000,
    actual: 1_410_000,
    missPct: 19.5,
  },
  {
    period: "2026-01",
    lineItem: "new_arr",
    forecast: 3_700_000,
    actual: 3_200_000,
    missPct: -13.5,
  },
  {
    period: "2026-01",
    lineItem: "llm_cogs",
    forecast: 1_300_000,
    actual: 1_620_000,
    missPct: 24.6,
  },
  { period: "2026-02", lineItem: "new_arr", forecast: 3_900_000, actual: 3_850_000, missPct: -1.3 },
  {
    period: "2026-02",
    lineItem: "llm_cogs",
    forecast: 1_550_000,
    actual: 2_280_000,
    missPct: 47.1,
  },
  { period: "2026-03", lineItem: "new_arr", forecast: 3_400_000, actual: 4_100_000, missPct: 20.6 },
  {
    period: "2026-03",
    lineItem: "llm_cogs",
    forecast: 1_700_000,
    actual: 2_410_000,
    missPct: 41.8,
  },
];

export const headcountByDept = [
  { dept: "Engineering", fte: 78, cost: 22_400_000, color: "chart-1" },
  { dept: "Go-to-Market", fte: 64, cost: 14_200_000, color: "chart-2" },
  { dept: "Customer Success", fte: 18, cost: 3_350_000, color: "chart-3" },
  { dept: "Marketing", fte: 12, cost: 2_100_000, color: "chart-4" },
  { dept: "G&A", fte: 14, cost: 2_500_000, color: "chart-5" },
];

export function computeCostPerAction(opts: {
  tokensIn: number;
  tokensOut: number;
  cacheHitRate: number;
  vendorMix: Record<string, number>;
  discountPct: number;
  routingOverheadPct: number;
  vendorDiscountPct?: Record<string, number>;
}) {
  const tokensIn = Math.max(0, opts.tokensIn);
  const tokensOut = Math.max(0, opts.tokensOut);
  const cacheHitRate = Math.min(1, Math.max(0, opts.cacheHitRate));
  const routingOverheadPct = Math.max(0, opts.routingOverheadPct);
  const baseDiscountPct = Math.min(100, Math.max(0, opts.discountPct));

  const normalizedEntries = Object.entries(opts.vendorMix)
    .map(([vendor, share]) => [vendor, Math.max(0, share)] as const)
    .filter(([, share]) => share > 0);
  const normalizedTotal = normalizedEntries.reduce((sum, [, share]) => sum + share, 0);
  const mix =
    normalizedTotal > 0
      ? normalizedEntries.map(([vendor, share]) => [vendor, share / normalizedTotal] as const)
      : [];

  let inference = 0;
  let afterDiscount = 0;
  for (const [vendor, share] of mix) {
    // Pick the flagship mid-tier model per vendor for blended calc
    const m =
      models.find((x) => x.vendor === vendor && x.modelName.includes("sonnet")) ||
      models.find((x) => x.vendor === vendor && x.modelName.includes("gpt-5-mini")) ||
      models.find((x) => x.vendor === vendor && x.modelName.includes("flash")) ||
      models.find((x) => x.vendor === vendor);
    if (!m) continue;
    const blendedIn = cacheHitRate * m.cachedInputPrice + (1 - cacheHitRate) * m.inputPrice;
    const inCost = (tokensIn / 1_000_000) * blendedIn;
    const outCost = (tokensOut / 1_000_000) * m.outputPrice;
    const vendorInference = (inCost + outCost) * share;
    const vendorDiscountPct = Math.min(
      100,
      Math.max(0, opts.vendorDiscountPct?.[vendor] ?? baseDiscountPct),
    );

    inference += vendorInference;
    afterDiscount += vendorInference * (1 - vendorDiscountPct / 100);
  }
  const total = afterDiscount * (1 + routingOverheadPct / 100);
  return {
    inference,
    discountSavings: inference - afterDiscount,
    routingOverhead: total - afterDiscount,
    total,
  };
}
