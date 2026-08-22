import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
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

export const authService = {
  login(input: LoginInput) {
    return api.post<ApiResponse<AuthSession>>(API_ENDPOINTS.auth.login, input);
  },

  signup(input: SignupInput) {
    return api.post<ApiResponse<AuthSession>>(API_ENDPOINTS.auth.signup, input);
  },

  logout() {
    return api.post<ApiResponse<{ loggedOut: boolean }>>(
      API_ENDPOINTS.auth.logout,
    );
  },

  me() {
    return api.get<ApiResponse<AuthSession>>(API_ENDPOINTS.auth.me);
  },

  refresh() {
    return api.post<ApiResponse<AuthSession>>(API_ENDPOINTS.auth.refresh);
  },

  changePassword(input: ChangePasswordInput) {
    return api.post<ApiResponse<{ changed: boolean }>>(
      API_ENDPOINTS.auth.changePassword,
      input,
    );
  },

  forgotPassword(input: ForgotPasswordInput) {
    return api.post<ApiResponse<{ sent: boolean }>>(
      API_ENDPOINTS.auth.forgotPassword,
      input,
    );
  },
};
