"use client";

import type { ReactNode } from "react";
import Button from "./button";
import Modal from "./modal";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  pendingLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  isPending?: boolean;
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  children,
  confirmLabel,
  pendingLabel,
  cancelLabel = "Cancelar",
  tone = "default",
  isPending = false,
}: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      dismissible={!isPending}
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            block={false}
            onClick={onClose}
            disabled={isPending}
            data-autofocus
          >
            {cancelLabel}
          </Button>

          <Button
            type="button"
            variant={tone === "danger" ? "danger" : "primary"}
            block={false}
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? (pendingLabel ?? confirmLabel) : confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  );
}
