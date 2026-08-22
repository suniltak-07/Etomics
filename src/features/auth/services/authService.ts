import { api } from "@/lib/api/client";
import type { ApiResponse } from "@/types/api";
import type { SessionUser } from "@/lib/auth/session";
import type {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  SignupInput,
} from "@/features/auth/schemas/authSchemas";

export type AuthUser = SessionUser;

export interface AuthSession {
  user: AuthUser;
  token: string;
  expiresIn?: number;
  refreshed?: boolean;
}

const AUTH_API = {
  login: "/api/auth/login",
  signup: "/api/auth/signup",
  logout: "/api/auth/logout",
  me: "/api/auth/me",
  refresh: "/api/auth/refresh",
  changePassword: "/api/auth/change-password",
  forgotPassword: "/api/auth/forgot-password",
} as const;

export const authService = {
  login(input: LoginInput) {
    return api.post<ApiResponse<AuthSession>>(AUTH_API.login, input);
  },

  signup(input: SignupInput) {
    return api.post<ApiResponse<AuthSession>>(AUTH_API.signup, input);
  },

  logout() {
    return api.post<ApiResponse<{ loggedOut: boolean }>>(AUTH_API.logout);
  },

  me() {
    return api.get<ApiResponse<AuthSession>>(AUTH_API.me);
  },

  refresh() {
    return api.post<ApiResponse<AuthSession>>(AUTH_API.refresh);
  },

  changePassword(input: ChangePasswordInput) {
    return api.post<ApiResponse<{ changed: boolean }>>(
      AUTH_API.changePassword,
      input,
    );
  },

  forgotPassword(input: ForgotPasswordInput) {
    return api.post<ApiResponse<{ sent: boolean }>>(
      AUTH_API.forgotPassword,
      input,
    );
  },
};
