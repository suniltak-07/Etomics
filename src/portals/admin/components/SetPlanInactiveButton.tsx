"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PlanStatus } from "@/types/enums";
import { useUpdatePlanStatus } from "@/features/plans/queries/usePlans";
import { useToast } from "@/store/useToast";

export function SetPlanInactiveButton({
  planId,
  planName,
  appearance = "button",
}: {
  planId: string;
  planName: string;
  appearance?: "button" | "link";
}) {
  const mutation = useUpdatePlanStatus();
  const toast = useToast();
  const [open, setOpen] = useState(false);

  async function onConfirm() {
    try {
      await mutation.mutateAsync({
        id: planId,
        status: PlanStatus.INACTIVE,
      });
      toast.success("Plan set inactive", "You can edit this plan now.");
    } catch (caught) {
      toast.error(
        "Could not set plan inactive",
        caught instanceof Error ? caught.message : "Please try again.",
      );
      throw caught;
    }
  }

  return (
    <>
      {appearance === "link" ? (
        <button
          type="button"
          disabled={mutation.isPending}
          onClick={() => setOpen(true)}
          className="text-brand-navy text-xs font-medium hover:underline disabled:opacity-50"
        >
          Set inactive
        </button>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={mutation.isPending}
          onClick={() => setOpen(true)}
        >
          Set inactive
        </Button>
      )}
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={onConfirm}
        description={`Set “${planName}” inactive? You can edit it after that. Customers will not see it while it is inactive.`}
        loading={mutation.isPending}
      />
    </>
  );
}
