export function LandingBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.5] dark:opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 75% 55% at 50% 0%, #000 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 75% 55% at 50% 0%, #000 30%, transparent 75%)",
        }}
      />
      <div
        className="absolute -top-24 left-1/2 h-[420px] w-[640px] -translate-x-1/2 rounded-full opacity-60 blur-[100px]"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary) / 0.22), transparent 65%)",
        }}
      />
      <div
        className="absolute right-0 top-40 h-[340px] w-[420px] rounded-full opacity-50 blur-[90px]"
        style={{ background: "radial-gradient(circle, hsl(var(--safe) / 0.16), transparent 65%)" }}
      />
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
