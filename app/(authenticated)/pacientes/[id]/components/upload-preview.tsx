"use client";

import type { AttachmentUpload } from "@/hooks/attachments/useAttachmentUploads";
import { useObjectUrl } from "@/hooks/attachments/useObjectUrl";
import { attachmentKind, guessContentType } from "@/lib/attachments";
import { useState } from "react";
import FilePreview, { PreviewMessage } from "./file-preview";
import PreviewDialog from "./preview-dialog";

interface Props {
  uploads: AttachmentUpload[];
  uploadId: string;
  open: boolean;
  onUploadChange: (id: string) => void;
  onClose: () => void;
}

export function canPreviewUpload(upload: AttachmentUpload) {
  return (
    upload.status !== "rejected" &&
    !upload.needsConsent &&
    guessContentType(upload.file) !== null
  );
}

function LocalPreview({ file, contentType }: { file: File; contentType: string }) {
  const url = useObjectUrl(file, contentType);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <PreviewMessage>
        Não foi possível exibir este arquivo no navegador. Ele pode ser enviado
        normalmente.
      </PreviewMessage>
    );
  }

  return (
    <FilePreview
      kind={attachmentKind(contentType)}
      url={url}
      fileName={file.name}
      onError={() => setFailed(true)}
    />
  );
}

export default function UploadPreview({
  uploads,
  uploadId,
  open,
  onUploadChange,
  onClose,
}: Props) {
  const previewable = uploads.filter(canPreviewUpload);
  const index = previewable.findIndex((upload) => upload.id === uploadId);
  const upload = previewable[index];
  const contentType = upload ? guessContentType(upload.file) : null;

  if (!upload || !contentType) {
    return null;
  }

  return (
    <PreviewDialog
      open={open}
      onClose={onClose}
      title="Pré-visualização"
      fileName={upload.file.name}
      size={upload.file.size}
      index={index}
      total={previewable.length}
      onIndexChange={(next) => {
        const target = previewable[next];

        if (target) {
          onUploadChange(target.id);
        }
      }}
    >
      <LocalPreview key={upload.id} file={upload.file} contentType={contentType} />
    </PreviewDialog>
  );
}
