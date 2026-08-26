import { PlanEditPage } from "@/portals/admin/pages/PlanPages";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { id } = await params;
  const { created } = await searchParams;
  return <PlanEditPage id={id} created={created === "1"} />;
}
