import { NavLink } from "react-router-dom";

import { cn } from "../../lib/utils";

const PROJECT_NAV_ITEMS = [
  { to: "", label: "Dashboard" },
  { to: "deployment", label: "Deployment" },
  { to: "workflows", label: "Workflows" },
  { to: "test-run", label: "Test Run" },
  { to: "evidence", label: "Evidence" },
];

export function ProjectNav() {
  return (
    <nav className="flex items-center gap-1 border-b border-border pb-2">
      {PROJECT_NAV_ITEMS.map((item) => (
        <NavLink
          key={item.label}
          to={item.to}
          end
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
  );
}
