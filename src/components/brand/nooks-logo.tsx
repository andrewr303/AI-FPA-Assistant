import { cn } from "@/lib/utils";

export function NooksLogo({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <div
        className="relative grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary shadow-[0_12px_28px_-16px_color-mix(in_oklab,var(--primary)_80%,transparent)]"
        aria-hidden
      >
        <div className="absolute inset-px rounded-[11px] bg-linear-to-br from-white/16 via-transparent to-black/10" />
        <svg className="relative h-5 w-5 text-white drop-shadow-sm" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 16.5h3.2l2.35-5.95 2.9 8.2L16 6l2.1 5.35H21"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M17.2 5.8H21v3.8"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="flex min-w-0 flex-col leading-none">
        <span className="truncate text-base font-bold tracking-tight text-foreground">
          AI FP&amp;A Expert
        </span>
        {!compact && (
          <span className="mt-1 truncate text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Finance Planning &amp; Analysis
          </span>
        )}
      </div>
    </div>
  );
}
