import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { clearAuthToken, getAuthToken, setAuthToken } from "../../lib/api";
import { queryKeys } from "../../lib/queryKeys";
import { getCurrentUser, login, signup } from "../../services/auth";

export function useCurrentUserQuery() {
  return useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: getCurrentUser,
    enabled: !!getAuthToken(),
    retry: false,
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: login,
    onSuccess: (token) => {
      setAuthToken(token.access_token);
      queryClient.invalidateQueries({ queryKey: queryKeys.currentUser });
    },
  });
}

export function useSignupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: signup,
    onSuccess: (token) => {
      setAuthToken(token.access_token);
      queryClient.invalidateQueries({ queryKey: queryKeys.currentUser });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return () => {
    clearAuthToken();
    queryClient.setQueryData(queryKeys.currentUser, undefined);
    queryClient.clear();
  };
}
