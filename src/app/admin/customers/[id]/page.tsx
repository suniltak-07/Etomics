import { CustomerDetailPage } from "@/portals/admin/pages/CustomersPages";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CustomerDetailPage id={id} />;
}
