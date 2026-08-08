"use client";

import { useState } from "react";

import { AuthPanel } from "./auth-panel";
import { ContactForm } from "./contact-form";
import { ToastDemo } from "./toast-demo";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

type ShowcaseKey = "auth" | "forms" | "toasts";

const tabs: Array<{ key: ShowcaseKey; label: string }> = [
  { key: "auth", label: "Auth" },
  { key: "forms", label: "Forms" },
  { key: "toasts", label: "Toasts" },
];

export function AdvancedShowcase() {
  const [active, setActive] = useState<ShowcaseKey>("auth" as ShowcaseKey);

  return (
    <Card className="grid gap-4 border-border/80 bg-background/80 shadow-xl">
      <div className="space-y-1">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Advanced options
        </p>
        <h2 className="text-2xl font-semibold">Click to switch between the selected extras</h2>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Button
            key={tab.key}
            type="button"
            variant={active === tab.key ? "default" : "outline"}
            onClick={() => setActive(tab.key)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-4">
        {active === "auth" ? <AuthPanel /> : null}
        {active === "forms" ? <ContactForm /> : null}
        {active === "toasts" ? <ToastDemo /> : null}
      </div>
    </Card>
  );
}
