import { authService } from "@/features/auth/services/authService";
import { clearPersistedAuth } from "@/features/auth/persistSession";
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
  clearPersistedAuth();
  dispatch(logout());
  replace("/login");
}
