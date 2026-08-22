import { AdminShell } from "@/portals/admin/components/AdminShell";

export const metadata = {
  title: "EatOmics Admin",
  description: "EatOmics administration portal",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
