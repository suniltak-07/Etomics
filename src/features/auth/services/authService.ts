import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse } from "@/types/api";
import type { User } from "@/types/entities";
import type {
  ForgotPasswordInput,
  LoginInput,
  SignupInput,
} from "@/features/auth/schemas/authSchemas";

export type AuthUser = Omit<User, "password">;

export interface AuthSession {
  user: AuthUser;
  token: string;
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
    return api.get<ApiResponse<{ user: AuthUser }>>(API_ENDPOINTS.auth.me);
  },

  forgotPassword(input: ForgotPasswordInput) {
    return api.post<ApiResponse<{ sent: boolean }>>(
      API_ENDPOINTS.auth.forgotPassword,
      input,
    );
  },
};
