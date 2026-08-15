import { PlanDetailPage } from "@/portals/admin/pages/PlanPages";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PlanDetailPage id={id} />;
}
