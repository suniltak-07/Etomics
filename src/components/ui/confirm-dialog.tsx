"use client";

import { useState } from "react";
import { Button, type ButtonVariant } from "@/components/ui/button";
import { Modal, ModalFooter } from "@/components/ui/modal";

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  /** Body copy. `message` is an alias of `description`. */
  message?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: ButtonVariant;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message,
  description,
  confirmLabel = "Yes",
  cancelLabel = "Cancel",
  confirmVariant = "primary",
  loading = false,
}: ConfirmDialogProps) {
  const [internalBusy, setInternalBusy] = useState(false);
  const busy = loading || internalBusy;
  const body = message ?? description ?? "This action can't be undone.";

  async function handleConfirm() {
    if (busy) return;
    try {
      setInternalBusy(true);
      await onConfirm();
      onClose();
    } catch {
      // Caller handles error messaging; keep the dialog open.
    } finally {
      setInternalBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={busy ? () => undefined : onClose}
      title={title}
      description={body}
      closeOnBackdrop={!busy}
      className="max-w-md"
      bodyClassName="py-4"
    >
      <ModalFooter className="mt-0 border-t-0 pt-0">
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={onClose}
        >
          {cancelLabel}
        </Button>
        <Button
          type="button"
          variant={confirmVariant}
          disabled={busy}
          onClick={() => void handleConfirm()}
        >
          {busy ? "Please wait…" : confirmLabel}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
