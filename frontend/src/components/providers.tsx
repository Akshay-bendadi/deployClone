"use client";

import type { ReactNode } from "react";

import { Toaster } from "sonner";

import { QueryClientProvider } from "@tanstack/react-query";

import { AuthProvider } from "../lib/auth";
import { queryClient } from "../lib/query-client";

type ProvidersProps = { children: ReactNode };

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <>
          {children}
          <Toaster richColors position="top-right" />
        </>
      </AuthProvider>
    </QueryClientProvider>
  );
}
