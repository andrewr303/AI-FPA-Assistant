import { cn } from "@/lib/utils";

export function NooksLogo({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <div
<<<<<<< HEAD
        className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-linear-to-br from-primary via-fuchsia-400 to-chart-2 shadow-[0_0_24px_-7px_color-mix(in_oklab,var(--primary)_85%,transparent)]"
        aria-hidden
      >
        <div className="absolute inset-px rounded-full bg-linear-to-br from-white/18 via-transparent to-black/18" />
        <svg
          className="relative h-7 w-7 text-white drop-shadow-sm"
          viewBox="0 0 256 256"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g transform="scale(5.12)">
            <path d="M25,2c-12.683,0 -23,10.318 -23,23c0,12.682 10.317,23 23,23c2.66652,0 5.22607,-0.45896 7.60938,-1.29883c1.83286,2.01855 4.46602,3.29883 7.39063,3.29883c5.5,0 10,-4.5 10,-10c0,-2.9246 -1.28028,-5.55777 -3.29883,-7.39062c0.83987,-2.38331 1.29883,-4.94286 1.29883,-7.60937c0,-12.682 -10.317,-23 -23,-23zM24,10h2.05078v2.80078c4.8,0.2 6.79961,4.29961 6.59961,7.09961h-2.09961c-0.1,-1.7 -0.7,-5.5 -5.5,-5.5c-4.7,0 -5.60156,2.7 -5.60156,5c0,6.9 13.70117,2.29883 13.70117,11.29883c0,1 -0.45039,6 -7.15039,6.5v2.80078h-2v-2.80078c-2.7,-0.3 -6.95039,-1.19844 -7.15039,-7.89844h2.09961c-0.2,6.3 5.90156,6.29883 6.10156,6.29883c5.9,0 6.09961,-4.00039 6.09961,-4.90039c0,-7.1 -13.70117,-2.1 -13.70117,-11.5c0,-1.9 0.95078,-6.09844 6.55078,-6.39844zM40,32c4.4,0 8,3.6 8,8c0,4.4 -3.6,8 -8,8c-4.4,0 -8,-3.6 -8,-8c0,-4.4 3.6,-8 8,-8zM44.30078,35.40039l-5.40039,6.29883l-3.30078,-2.5l-1.19922,1.60156l4.69922,3.59961l6.70117,-7.70117z" />
          </g>
=======
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
>>>>>>> origin/main
        </svg>
      </div>
      <div className="flex min-w-0 flex-col leading-none">
        <span className="truncate text-base font-bold tracking-tight text-foreground">
          AI FP&amp;A Expert
        </span>
      </div>
    </div>
  );
}
