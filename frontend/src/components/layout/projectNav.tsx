import { FileSearch, FlaskConical, LayoutDashboard, Rocket, Workflow } from "lucide-react";
import { NavLink } from "react-router-dom";

import { cn } from "../../lib/utils";

const PROJECT_NAV_ITEMS = [
  { to: "", label: "Dashboard", icon: LayoutDashboard },
  { to: "deployment", label: "Deployment", icon: Rocket },
  { to: "workflows", label: "Workflows", icon: Workflow },
  { to: "test-run", label: "Test Run", icon: FlaskConical },
  { to: "evidence", label: "Evidence", icon: FileSearch },
];

export function ProjectNav() {
  return (
    <nav className="-mb-px flex items-center gap-1 overflow-x-auto border-b border-border">
      {PROJECT_NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={label}
          to={to}
          end
          className={({ isActive }) =>
            cn(
              "relative flex shrink-0 items-center gap-1.5 whitespace-nowrap px-3.5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
              isActive && "text-foreground",
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon className="h-4 w-4" />
              {label}
              <span
                className={cn(
                  "pointer-events-none absolute inset-x-2.5 -bottom-px h-0.5 rounded-full bg-primary transition-opacity",
                  isActive ? "opacity-100" : "opacity-0",
                )}
              />
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
