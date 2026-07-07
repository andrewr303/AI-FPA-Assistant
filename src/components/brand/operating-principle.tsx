import { cn } from "@/lib/utils";

const labels: Record<string, string> = {
  "ask-why": "Find the Driver",
  "do-more-with-less": "Do More With Less",
  "earn-customer-love": "Earn Customer Love",
  "extreme-ownership": "Extreme Ownership",
};

export function OperatingPrinciple({
  principle,
  className,
}: {
  principle: keyof typeof labels;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground",
        className,
      )}
    >
      <span className="h-px w-6 bg-border" />
      {labels[principle]}
    </div>
  );
}
