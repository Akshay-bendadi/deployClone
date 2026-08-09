import { useEffect, useState } from "react";

export function TeardownCountdown({ teardownAt, onExpired }: { teardownAt: string; onExpired?: () => void }) {
  const [remaining, setRemaining] = useState(() => calcRemaining(teardownAt));

  useEffect(() => {
    const interval = setInterval(() => {
      const r = calcRemaining(teardownAt);
      setRemaining(r);
      if (r <= 0) {
        clearInterval(interval);
        onExpired?.();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [teardownAt, onExpired]);

  if (remaining <= 0) return <span className="text-xs text-destructive font-medium">Auto-deleting now...</span>;

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <span className="text-xs text-muted-foreground">
      Auto-delete in{" "}
      <span className="font-mono font-medium text-foreground">
        {minutes}:{seconds.toString().padStart(2, "0")}
      </span>
    </span>
  );
}

function calcRemaining(teardownAt: string): number {
  return Math.max(0, Math.floor((new Date(teardownAt).getTime() - Date.now()) / 1000));
}
