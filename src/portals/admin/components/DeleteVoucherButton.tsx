"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useDeleteVoucher } from "@/features/vouchers/queries/useVouchers";
import { useToast } from "@/store/useToast";

export function DeleteVoucherButton({
  voucherId,
  voucherCode,
  redirectTo,
  appearance = "button",
}: {
  voucherId: string;
  voucherCode: string;
  redirectTo?: string;
  appearance?: "button" | "link";
}) {
  const router = useRouter();
  const deleteMutation = useDeleteVoucher();
  const toast = useToast();
  const [open, setOpen] = useState(false);

  async function onConfirm() {
    try {
      await deleteMutation.mutateAsync(voucherId);
      toast.success("Voucher deleted");
      setOpen(false);
      if (redirectTo) {
        router.push(redirectTo);
      }
    } catch (caught) {
      toast.error(
        "Could not delete voucher",
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
        description={`Delete “${voucherCode}”? This action can't be undone.`}
        confirmVariant="danger"
        loading={deleteMutation.isPending}
      />
    </>
  );
}
