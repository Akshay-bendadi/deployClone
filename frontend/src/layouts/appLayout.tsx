import { NavLink, Outlet } from "react-router-dom";

import { BrandMark } from "../components/brandMark";
import { ThemeToggle } from "../components/theme-toggle";
import { cn } from "../lib/utils";

const navItems = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/deployment", label: "Deployment" },
  { to: "/test-run", label: "Test Run" },
  { to: "/evidence", label: "Evidence" },
];

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border px-6 py-4 lg:px-8">
        <div className="flex items-center gap-8">
          <BrandMark />
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground",
                    isActive && "bg-primary/10 text-primary hover:text-primary",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <ThemeToggle />
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
