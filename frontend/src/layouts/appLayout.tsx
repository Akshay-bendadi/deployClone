import { Link, Outlet } from "react-router-dom";

import { BrandMark } from "../components/brandMark";
import { ThemeToggle } from "../components/theme-toggle";
import { Button } from "../components/ui/button";
import { useAuth } from "../lib/auth";

export function AppLayout() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border px-6 py-4 lg:px-8">
        <Link to={isAuthenticated ? "/projects" : "/"}>
          <BrandMark />
        </Link>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-muted-foreground">{user?.email}</span>
              <Button variant="outline" onClick={logout}>
                Log out
              </Button>
            </>
          ) : null}
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
