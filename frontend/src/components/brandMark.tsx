export function BrandMark() {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="30" height="30" viewBox="0 0 30 30" fill="none" className="shrink-0">
        <rect
          x="10"
          y="2"
          width="18"
          height="18"
          rx="5"
          className="fill-none stroke-primary/50"
          strokeWidth="1.75"
          strokeDasharray="3 3"
        />
        <rect x="2" y="10" width="18" height="18" rx="5" className="fill-primary" />
        <path
          d="M8.5 19.5l2.5 2.5 4.5-5"
          stroke="hsl(var(--primary-foreground))"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      <span className="text-lg font-semibold tracking-[-0.02em]">
        deploy<span className="text-muted-foreground">Clone</span>
      </span>
    </div>
  );
}
