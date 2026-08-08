export function BrandMark() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="relative inline-block h-6 w-6 shrink-0">
        <span className="absolute left-0 top-0.5 h-4 w-4 rounded-[5px] border-[1.5px] border-muted-foreground/40" />
        <span className="absolute bottom-0.5 right-0 h-4 w-4 rounded-[5px] bg-primary" />
      </span>
      <span className="text-[0.95rem] font-semibold tracking-[-0.02em]">
        deploy<span className="text-muted-foreground">Clone</span>
      </span>
    </div>
  );
}
