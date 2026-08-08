export function TwinDiffPreview() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Production
        </p>
        <pre className="mt-3 font-mono text-xs leading-6 text-foreground">
          {"{\n"}
          {"  "}
          <span className="text-safe">"title"</span>: "Login bug",
          {"\n  "}
          <span className="text-muted-foreground">"status"</span>: "open"
          {"\n}"}
        </pre>
        <p className="mt-3 text-xs font-semibold text-safe">🟢 200 OK</p>
      </div>
      <div className="rounded-2xl border border-block/40 bg-card p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Twin
        </p>
        <pre className="mt-3 font-mono text-xs leading-6 text-foreground">
          {"{\n"}
          {"  "}
          <span className="bg-block/20 text-block">"name"</span>: "Login bug",
          {"\n  "}
          <span className="text-muted-foreground">"status"</span>: "open"
          {"\n}"}
        </pre>
        <p className="mt-3 text-xs font-semibold text-block">🔴 Contract changed</p>
      </div>
    </div>
  );
}
