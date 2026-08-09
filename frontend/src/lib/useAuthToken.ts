import { useSyncExternalStore } from "react";

import { getAuthToken, subscribeAuthToken } from "./api";

/** Reactive view of the stored auth token — re-renders subscribers the instant
 * setAuthToken()/clearAuthToken() run, unlike a plain getAuthToken() call which only
 * reflects reality on whatever render happens to occur next. */
export function useAuthToken(): string | null {
  return useSyncExternalStore(subscribeAuthToken, getAuthToken);
}
