import { Link, Outlet } from "react-router-dom";

import { BrandMark } from "../components/brandMark";
import { UserMenu } from "../components/layout/userMenu";
import { ThemeToggle } from "../components/theme-toggle";
import { useAuth } from "../lib/auth";

export function AppLayout() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border px-6 py-4 lg:px-8">
        <Link to={isAuthenticated ? "/projects" : "/"}>
          <BrandMark />
        </Link>
        {isAuthenticated && user ? (
          <UserMenu email={user.email} onLogout={logout} />
        ) : (
          <ThemeToggle />
        )}
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
