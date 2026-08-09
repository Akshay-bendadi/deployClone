// The brand's visual signature — a dashed "twin" outline paired with a solid
// block — reused at small scale as a structural marker throughout the app
// (section eyebrows, step indicators, production/twin comparisons).
export function TwinGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <rect
        x="7.25"
        y="1.25"
        width="11.5"
        height="11.5"
        rx="3.5"
        className="stroke-current opacity-45"
        strokeWidth="1.5"
        strokeDasharray="2.4 2.4"
      />
      <rect x="1.25" y="7.25" width="11.5" height="11.5" rx="3.5" className="fill-current" />
    </svg>
  );
}
