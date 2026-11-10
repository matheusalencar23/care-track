"use client";

import Button from "@/app/ui/button";
import Modal from "@/app/ui/modal";
import { formatFileSize } from "@/lib/attachments";
import type { ReactNode } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  fileName: string;
  size: number;
  index: number;
  total: number;
  onIndexChange: (index: number) => void;
  children: ReactNode;
}

export default function PreviewDialog({
  open,
  onClose,
  title,
  fileName,
  size,
  index,
  total,
  onIndexChange,
  children,
}: Props) {
  const footer =
    total > 1 ? (
      <>
        <Button
          type="button"
          variant="secondary"
          block={false}
          disabled={index === 0}
          onClick={() => onIndexChange(index - 1)}
        >
          Anterior
        </Button>
        <Button
          type="button"
          variant="secondary"
          block={false}
          disabled={index === total - 1}
          onClick={() => onIndexChange(index + 1)}
        >
          Próximo
        </Button>
      </>
    ) : undefined;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={total > 1 ? `${title} ${index + 1} de ${total}` : title}
      footer={footer}
    >
      <p className="mb-4 break-all">
        <span className="font-semibold text-white">{fileName}</span>
        <span className="text-slate-300">
          {" · "}
          {formatFileSize(size)}
        </span>
      </p>

      {open && children}
    </Modal>
  );
}
