import { redirect } from "next/navigation";
import { getOptionalAuth } from "@/lib/auth/requireAuth";
import { AdminShell } from "@/portals/admin/components/AdminShell";
import { UserRole } from "@/types/enums";

export const metadata = {
  title: "EatOmics Admin",
  description: "EatOmics administration portal",
};

const ADMIN_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.SUPER_ADMIN];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await getOptionalAuth();

  // Soft server check when session cookies exist; client AdminShell is the primary gate.
  if (user && !ADMIN_ROLES.includes(user.role)) {
    redirect("/login?redirect=/admin/dashboard");
  }

  return <AdminShell>{children}</AdminShell>;
}
