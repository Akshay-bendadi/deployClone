import axios, { AxiosError } from "axios";

import { getApiBaseUrl } from "./env";

const baseURL = getApiBaseUrl();
const baseOrigin = new URL(baseURL).origin;

type ApiError = {
  message: string;
  status?: number;
  data?: unknown;
};

function removeAuthorizationHeaders(headers: unknown): void {
  if (!headers || typeof headers !== "object") {
    return;
  }

  const mutableHeaders = headers as Record<string, unknown> & {
    delete?: (header: string) => boolean;
  };

  if (typeof mutableHeaders.delete === "function") {
    mutableHeaders.delete("Authorization");
    mutableHeaders.delete("authorization");
    return;
  }

  delete mutableHeaders.Authorization;
  delete mutableHeaders.authorization;
}
const api = axios.create({
  baseURL,
  timeout: 15_000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const requestUrl = new URL(config.url ?? "", baseURL);

  if (requestUrl.origin !== baseOrigin) {
    removeAuthorizationHeaders(config.headers);
    throw new Error("Blocked cross-origin API request. Use the configured API base URL instead.");
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401 && typeof window !== "undefined") {
        window.location.href = "/login";
      }

      const responseData = error.response?.data as { message?: string } | undefined;

      return Promise.reject({
        message: responseData?.message || error.message || "Request failed",
        status: error.response?.status,
        data: error.response?.data,
      } satisfies ApiError);
    }

    return Promise.reject({
      message: "Unexpected network error",
    } satisfies ApiError);
  },
);

export type { ApiError };
export default api;
