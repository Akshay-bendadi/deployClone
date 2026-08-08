import api from "../lib/api";

export type SignupPayload = { email: string; password: string };
export type LoginPayload = { email: string; password: string };
export type Token = { access_token: string; token_type: string };
export type CurrentUser = { email: string };

export function signup(payload: SignupPayload) {
  return api.post<Token>("/api/v1/auth/signup", payload).then((res) => res.data);
}

export function login(payload: LoginPayload) {
  return api.post<Token>("/api/v1/auth/login", payload).then((res) => res.data);
}

export function getCurrentUser() {
  return api.get<CurrentUser>("/api/v1/auth/me").then((res) => res.data);
}
