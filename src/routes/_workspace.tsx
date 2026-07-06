import { Outlet, createFileRoute } from "@tanstack/react-router";
import { SidebarNav } from "@/components/workspace/sidebar-nav";
import { CopilotProvider } from "@/components/workspace/copilot-context";
import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, Tag, FileText, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_workspace")({
  component: WorkspaceLayout,
});

function WorkspaceLayout() {
  const location = useLocation();
  const mobileNav = [
    { to: "/", label: "Treasury", icon: LayoutDashboard },
    { to: "/pricing-plays", label: "Pricing", icon: Tag },
    { to: "/variance-narrator", label: "Variance", icon: FileText },
    { to: "/copilot", label: "Ask", icon: Sparkles },
  ];

  return (
    <CopilotProvider>
      <div className="flex min-h-screen text-foreground bg-grid">
        <SidebarNav />
        <main className="flex-1 min-w-0 flex flex-col pb-16 md:pb-0">
          <Outlet />
          <footer className="mt-auto border-t border-border/60 px-6 py-4 text-[11px] text-muted-foreground font-medium uppercase tracking-widest flex items-center justify-between">
            <span>AI FP&amp;A Expert</span>
            <span className="text-primary/80">More signal. Less spreadsheet.</span>
          </footer>
        </main>
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border/60 glass-bar px-2 py-2 grid grid-cols-4 gap-1">
          {mobileNav.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "rounded-md px-2 py-2 text-[11px] flex flex-col items-center gap-1 transition-colors",
                  active ? "text-primary bg-primary/10" : "text-muted-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </CopilotProvider>
  );
}
