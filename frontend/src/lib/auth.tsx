import { type ReactNode, createContext, useContext, useMemo } from "react";

import { useCurrentUserQuery, useLogout } from "../hooks/queries/useAuth";
import type { CurrentUser } from "../services/auth";
import { getAuthToken } from "./api";

type AuthContextValue = {
  user: CurrentUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const currentUserQuery = useCurrentUserQuery();
  const logout = useLogout();

  // A token existing but not yet validated is "loading", not "unauthenticated" — using
  // TanStack's own isLoading (isPending && isFetching) here would race: on the render
  // where `enabled` first flips true, the fetch hasn't been kicked off yet, so
  // isFetching is briefly false and this would read as "not loading, not authenticated",
  // bouncing straight back to /login before /auth/me ever gets called.
  const hasToken = !!getAuthToken();
  const value = useMemo<AuthContextValue>(
    () => ({
      user: currentUserQuery.data ?? null,
      isAuthenticated: !!currentUserQuery.data,
      isLoading: hasToken && currentUserQuery.isPending,
      logout,
    }),
    [currentUserQuery.data, currentUserQuery.isPending, hasToken, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
