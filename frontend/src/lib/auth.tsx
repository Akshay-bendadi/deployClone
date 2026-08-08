"use client";

import { type ReactNode, createContext, useContext, useEffect, useMemo, useState } from "react";

export type AuthUser = {
  name: string;
  email: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
};

const AUTH_STORAGE_KEY = "firstbase-user";
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredUser(): AuthUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored) as AuthUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(readStoredUser());
  }, []);

  function login(nextUser: AuthUser) {
    setUser(nextUser);
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
  }

  function logout() {
    setUser(null);
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      logout,
    }),
    [user],
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
