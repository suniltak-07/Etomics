import { redirect } from "next/navigation";
import { getServerSession, type SessionUser } from "@/lib/auth/session";
import { UserRole } from "@/types/enums";

export interface AuthContext {
  user: SessionUser;
  token: string;
}

export interface RequireAuthOptions {
  /** Where to send unauthenticated users. */
  loginRedirect?: string;
  /** Where to send authenticated users lacking the required role. */
  forbiddenRedirect?: string;
}

const DEFAULT_LOGIN = "/login";
const DEFAULT_FORBIDDEN = "/forbidden";

export async function requireAuth(
  options: RequireAuthOptions = {},
): Promise<AuthContext> {
  const { token, user } = await getServerSession();

  if (!token || !user) {
    redirect(options.loginRedirect ?? DEFAULT_LOGIN);
  }

  return { token, user };
}

export async function requireRole(
  roles: readonly UserRole[],
  options: RequireAuthOptions = {},
): Promise<AuthContext> {
  const auth = await requireAuth(options);

  if (!roles.includes(auth.user.role)) {
    redirect(options.forbiddenRedirect ?? DEFAULT_FORBIDDEN);
  }

  return auth;
}

export async function requireAdmin(
  options: RequireAuthOptions = {},
): Promise<AuthContext> {
  return requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN], options);
}

export async function requireSuperAdmin(
  options: RequireAuthOptions = {},
): Promise<AuthContext> {
  return requireRole([UserRole.SUPER_ADMIN], options);
}

export async function requireCustomer(
  options: RequireAuthOptions = {},
): Promise<AuthContext> {
  return requireRole([UserRole.CUSTOMER], options);
}

export async function getOptionalAuth(): Promise<{
  user: SessionUser | null;
  token: string | null;
}> {
  return getServerSession();
}
