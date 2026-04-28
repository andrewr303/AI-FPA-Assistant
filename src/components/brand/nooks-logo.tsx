import { cn } from "@/lib/utils";

export function NooksLogo({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className="h-7 w-7 rounded-md bg-linear-to-br from-primary via-primary to-primary/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_4px_12px_-2px_color-mix(in_oklab,var(--primary)_50%,transparent)]"
        aria-hidden
      />
      <div className="flex flex-col leading-none">
        <span className="text-lg font-bold tracking-tight lowercase text-foreground">nooks</span>
        {!compact && (
          <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            FP&amp;A Workspace
          </span>
        )}
      </div>
    </div>
  );
}
