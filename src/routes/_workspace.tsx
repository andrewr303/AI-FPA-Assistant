import { Outlet, createFileRoute } from "@tanstack/react-router";
import { SidebarNav } from "@/components/workspace/sidebar-nav";
import { CopilotProvider } from "@/components/workspace/copilot-context";

export const Route = createFileRoute("/_workspace")({
  component: WorkspaceLayout,
});

function WorkspaceLayout() {
  return (
    <CopilotProvider>
      <div className="flex min-h-screen bg-background text-foreground bg-grid">
        <SidebarNav />
        <main className="flex-1 min-w-0 flex flex-col">
          <Outlet />
          <footer className="mt-auto border-t border-border px-6 py-4 text-[11px] text-muted-foreground font-medium uppercase tracking-widest flex items-center justify-between">
            <span>Nooks FP&amp;A Workspace</span>
            <span className="text-primary/80">More signal. Less spreadsheet.</span>
          </footer>
        </main>
      </div>
    </CopilotProvider>
  );
}
