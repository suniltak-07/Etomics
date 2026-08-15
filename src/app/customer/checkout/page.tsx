"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoadingState } from "@/components/states";
import { CheckoutWizard } from "@/features/checkout/components/CheckoutWizard";
import { UserRole } from "@/types/enums";
import { useAppSelector } from "@/store/hooks";

export default function CustomerCheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, hydrated } = useAppSelector((state) => state.auth);
  const planId = searchParams.get("planId") ?? undefined;

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      const returnPath = planId
        ? `/customer/checkout?planId=${encodeURIComponent(planId)}`
        : "/customer/checkout";
      router.replace(`/login?returnUrl=${encodeURIComponent(returnPath)}`);
    }
  }, [hydrated, user, router, planId]);

  if (!hydrated || !user || user.role !== UserRole.CUSTOMER) {
    return <LoadingState title="Preparing checkout" />;
  }

  return <CheckoutWizard initialPlanId={planId} />;
}
