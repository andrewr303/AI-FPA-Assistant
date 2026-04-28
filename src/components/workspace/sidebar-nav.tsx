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
  { to: "/variance-narrator", label: "Variance Narrator", icon: FileText, group: "Planning" },
  { to: "/headcount-plays", label: "Headcount", icon: Users, group: "Planning" },
  { to: "/forecast-confidence", label: "Forecast Confidence", icon: Target, group: "Planning" },
  { to: "/signal-desk", label: "Signal Desk", icon: Radio, group: "Ops" },
  { to: "/copilot", label: "Ask Finance", icon: Sparkles, group: "Ops" },
] as const;

export function SidebarNav() {
  const location = useLocation();
  const groups = Array.from(new Set(NAV.map((n) => n.group)));

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="px-5 pt-6 pb-4 border-b border-sidebar-border">
        <NooksLogo />
      </div>
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 space-y-5">
        {groups.map((g) => (
          <div key={g}>
            <div className="px-2 mb-2 text-[10px] uppercase tracking-widest text-muted-foreground/70 font-semibold">
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
                      "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
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
        <div className="rounded-lg bg-linear-to-br from-accent to-accent/30 p-3 border border-primary/20">
          <div className="text-[10px] uppercase tracking-widest text-accent-foreground/80 font-semibold mb-1">
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
