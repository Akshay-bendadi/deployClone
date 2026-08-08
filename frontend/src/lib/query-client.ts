import { toast } from "sonner";

import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";

import type { ApiError } from "./api";

function getErrorMessage(error: unknown): string {
  const apiError = error as Partial<ApiError> | undefined;
  return apiError?.message || "Something went wrong";
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30_000,
    },
  },
  // Centralized error toasts so no failed request goes unnoticed — individual call
  // sites only need to opt out (meta: { silent: true }) for expected-failure states
  // (e.g. a 404 risk-report before a release has been tested) or add a toast.success
  // for the happy path.
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (query.meta?.silent) {
        return;
      }
      toast.error(getErrorMessage(error));
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      if (mutation.meta?.silent) {
        return;
      }
      toast.error(getErrorMessage(error));
    },
  }),
});
