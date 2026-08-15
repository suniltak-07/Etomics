import { Suspense } from "react";
import { SubscriptionsListPage } from "@/portals/admin/pages/SubscriptionsPage";
import { LoadingState } from "@/components/states/LoadingState";

export default function Page() {
  return (
    <Suspense fallback={<LoadingState title="Loading subscriptions" />}>
      <SubscriptionsListPage />
    </Suspense>
  );
}
