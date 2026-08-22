import { AUTH_TOKEN_KEY } from "@/lib/api/client";
import { authService } from "@/features/auth/services/authService";
import { clearClientSession } from "@/lib/auth/session";
import { beginLogoutRedirect } from "@/lib/auth/logout-redirect";
import type { AppDispatch } from "@/store";
import { logout } from "@/store/slices/authSlice";

export async function signOutAndGoToLogin(
  dispatch: AppDispatch,
  replace: (href: string) => void,
): Promise<void> {
  beginLogoutRedirect();
  try {
    await authService.logout();
  } catch {
    // still clear local session
  }
  clearClientSession();
  try {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    // ignore
  }
  dispatch(logout());
  replace("/login");
}
