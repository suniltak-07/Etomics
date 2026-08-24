"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useDeletePlan } from "@/features/plans/queries/usePlans";
import { useToast } from "@/store/useToast";

export function DeletePlanButton({
  planId,
  planName,
  redirectTo,
  appearance = "button",
}: {
  planId: string;
  planName: string;
  redirectTo?: string;
  appearance?: "button" | "link";
}) {
  const router = useRouter();
  const deleteMutation = useDeletePlan();
  const toast = useToast();
  const [open, setOpen] = useState(false);

  async function onConfirm() {
    try {
      await deleteMutation.mutateAsync(planId);
      toast.success("Plan deleted");
      setOpen(false);
      if (redirectTo) {
        router.push(redirectTo);
      }
    } catch (caught) {
      toast.error(
        "Could not delete plan",
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
          disabled={deleteMutation.isPending}
          onClick={() => setOpen(true)}
          className="text-brand-danger text-xs font-medium hover:underline disabled:opacity-50"
        >
          Delete
        </button>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="danger"
          disabled={deleteMutation.isPending}
          onClick={() => setOpen(true)}
        >
          Delete
        </Button>
      )}
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={onConfirm}
        description={`Delete “${planName}”? This action can't be undone.`}
        confirmVariant="danger"
        loading={deleteMutation.isPending}
      />
    </>
  );
}
