import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FlaskConical,
  Activity,
  Tag,
  Boxes,
  Waves,
  FileText,
  Users,
  Target,
  Radio,
  Sparkles,
  BrainCircuit,
  HandCoins,
  ShieldAlert,
  Map,
} from "lucide-react";
import { NooksLogo } from "@/components/brand/nooks-logo";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Treasury", icon: LayoutDashboard, group: "Overview" },
  {
    to: "/sequencing-margin-lab",
    label: "Margin Lab",
    icon: FlaskConical,
    group: "Cost engineering",
  },
  { to: "/utilization-simulator", label: "Utilization", icon: Activity, group: "Cost engineering" },
  { to: "/vendor-portfolio", label: "Vendor Portfolio", icon: Boxes, group: "Cost engineering" },
  { to: "/pricing-plays", label: "Pricing Plays", icon: Tag, group: "Revenue" },
  { to: "/arr-waterfall", label: "ARR Waterfall", icon: Waves, group: "Revenue" },
  {
    to: "/customer-profitability",
    label: "Customer Profitability",
    icon: HandCoins,
    group: "Revenue",
  },
  { to: "/renewal-risk", label: "Renewal Risk", icon: ShieldAlert, group: "Revenue" },
  { to: "/variance-narrator", label: "Variance Narrator", icon: FileText, group: "Planning" },
  { to: "/headcount-plays", label: "Headcount", icon: Users, group: "Planning" },
  { to: "/forecast-confidence", label: "Forecast Confidence", icon: Target, group: "Planning" },
  { to: "/year-one-roadmap", label: "Year One Roadmap", icon: Map, group: "Planning" },
  { to: "/signal-desk", label: "Signal Desk", icon: Radio, group: "Ops" },
  { to: "/ai-finops-optimizer", label: "AI FinOps Optimizer", icon: BrainCircuit, group: "Ops" },
  { to: "/copilot", label: "Ask FP&A Expert", icon: Sparkles, group: "Ops" },
] as const;

export function SidebarNav() {
  const location = useLocation();
  const groups = Array.from(new Set(NAV.map((n) => n.group)));

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-sidebar-border/70 glass-bar">
      <div className="border-b border-sidebar-border/70 px-5 pb-4 pt-6">
        <NooksLogo />
      </div>
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 space-y-6">
        {groups.map((g) => (
          <div key={g}>
            <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/65">
              {g}
            </div>
            <div className="space-y-0.5">
              {NAV.filter((n) => n.group === g).map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-all duration-200",
                      active
                        ? "bg-sidebar-accent/95 text-white font-medium shadow-[inset_0_1px_0_color-mix(in_oklab,white_8%,transparent)]"
                        : "text-muted-foreground hover:bg-sidebar-accent/55 hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0 transition-colors group-hover:text-white" />
                    <span className="truncate">{item.label}</span>
                    {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-sidebar-border p-4">
        <div className="quiet-panel hairline rounded-xl border p-3">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80">
            Demo build
          </div>
          <div className="text-xs text-muted-foreground leading-snug">
            More signal. Less spreadsheet.
          </div>
        </div>
      </div>
    </aside>
  );
}
