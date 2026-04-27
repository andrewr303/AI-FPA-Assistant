import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Search } from "lucide-react";

export function TopBar({
  title,
  subtitle,
  onAskFinance,
}: {
  title: string;
  subtitle?: string;
  onAskFinance?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border bg-background/60 backdrop-blur-xl px-6 py-4 sticky top-0 z-30">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight truncate">{title}</h1>
          <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">
            FY26
          </Badge>
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hidden sm:inline-flex">
          <Search className="h-4 w-4" />
          <span className="text-xs">Sweep</span>
          <kbd className="ml-1 text-[10px] font-mono rounded border border-border px-1 py-0.5">
            ⌘K
          </kbd>
        </Button>
        <Button
          size="sm"
          onClick={onAskFinance}
          className="gap-2 glow-violet bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Sparkles className="h-4 w-4" />
          Ask Finance
        </Button>
      </div>
    </div>
  );
}
