import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { clearAuthToken, setAuthToken } from "../../lib/api";
import { queryKeys } from "../../lib/queryKeys";
import { useAuthToken } from "../../lib/useAuthToken";
import { getCurrentUser, login, signup } from "../../services/auth";

export function useCurrentUserQuery() {
  const token = useAuthToken();
  return useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: getCurrentUser,
    enabled: !!token,
    retry: false,
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: login,
    onSuccess: async (token) => {
      setAuthToken(token.access_token);
      // Must be awaited: the page's own onSuccess (navigate("/projects")) only runs
      // after this promise resolves. Without awaiting, navigation raced ahead of the
      // /auth/me refetch — RequireAuth would read the still-stale "no user data yet"
      // state and immediately bounce back to /login, even though login had succeeded.
      await queryClient.invalidateQueries({ queryKey: queryKeys.currentUser });
    },
  });
}

export function useSignupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: signup,
    onSuccess: async (token) => {
      setAuthToken(token.access_token);
      await queryClient.invalidateQueries({ queryKey: queryKeys.currentUser });
    },
  });
}

export function useLogout() {
  // A hard redirect, not queryClient.clear() + navigate(): this hook is called from
  // AuthProvider, which sits above <RouterProvider> in main.tsx, so it can't call
  // useNavigate() itself. Handing navigation to the caller (a client-side navigate())
  // meant the route change and the query cache reset had to land in the same React
  // batch in the right order, which raced in practice. A full reload sidesteps that
  // entirely — the app boots fresh with no token, same pattern api.ts already uses on
  // a 401 from an expired session.
  return () => {
    clearAuthToken();
    window.location.href = "/login";
  };
}
