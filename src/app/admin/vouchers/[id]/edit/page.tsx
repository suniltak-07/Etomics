import { VoucherEditPage } from "@/portals/admin/pages/VouchersPages";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <VoucherEditPage id={id} />;
}
