"use client";

import { toast } from "sonner";

import { Button } from "./ui/button";
import { Card } from "./ui/card";

export function ToastDemo() {
  return (
    <Card className="grid gap-4 border-border/80 bg-background/80 shadow-xl">
      <div className="space-y-1">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Toast system
        </p>
        <h2 className="text-2xl font-semibold">Sonner is wired and ready</h2>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={() => toast.success("Everything is working.")}>
          Success toast
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => toast.error("Something needs attention.")}
        >
          Error toast
        </Button>
      </div>
    </Card>
  );
}
