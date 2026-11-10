"use client";

import Button from "@/app/ui/button";
import RequestId from "@/app/ui/request-id";
import Skeleton from "@/app/ui/skeleton";
import { useAttachmentDownload } from "@/hooks/attachments/useAttachmentDownload";
import { attachmentKind, requiresImageConsent } from "@/lib/attachments";
import { notifyError } from "@/lib/notify-error";
import type { Attachment } from "@/model/attachment";
import { hasErrorCode } from "@/shared/ApiError";
import { useRef, useState } from "react";
import { CONSENT_SECTION_ANCHOR } from "./attachment-uploader";
import FilePreview, { PreviewMessage } from "./file-preview";
import PreviewDialog from "./preview-dialog";

interface Props {
  patientId: string;
  attachments: Attachment[];
  index: number;
  open: boolean;
  canViewMedia?: boolean;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

interface PreviewProps {
  patientId: string;
  attachment: Attachment;
  canViewMedia?: boolean;
  onClose: () => void;
}

function ConsentRequired({ onClose }: { onClose: () => void }) {
  return (
    <div className="rounded-xl border border-warning-400/30 bg-warning-500/10 p-4">
      <p>
        A visualização de fotos e vídeos depende de uma autorização de uso de
        imagem ativa. O arquivo continua guardado e volta a abrir quando uma
        autorização for registrada.
      </p>
      <a
        href={CONSENT_SECTION_ANCHOR}
        onClick={onClose}
        className="mt-2 inline-block underline underline-offset-2 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      >
        Ir para a autorização de uso de imagem
      </a>
    </div>
  );
}

function AttachmentPreview({
  patientId,
  attachment,
  canViewMedia,
  onClose,
}: PreviewProps) {
  const kind = attachmentKind(attachment.contentType);
  const blocked =
    requiresImageConsent(attachment.contentType) && canViewMedia === false;
  const {
    data,
    error,
    isConsentRequired,
    isPending,
    refetch,
    requestDownloadUrl,
  } = useAttachmentDownload(patientId, attachment.id, { enabled: !blocked });
  const [renewed, setRenewed] = useState(false);
  const [mediaFailed, setMediaFailed] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const resumeAt = useRef(0);

  if (blocked || isConsentRequired) {
    return <ConsentRequired onClose={onClose} />;
  }

  if (isPending) {
    return (
      <div aria-busy>
        <span className="sr-only">Carregando anexo...</span>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div role="alert" className="space-y-3">
        <p>
          {hasErrorCode(error, "ATTACHMENT_NOT_FOUND")
            ? "Anexo não encontrado."
            : "Não foi possível abrir o anexo."}
        </p>
        <RequestId error={error} />
        <Button
          type="button"
          variant="secondary"
          block={false}
          onClick={() => refetch()}
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  function handleMediaError() {
    if (renewed) {
      setMediaFailed(true);
      return;
    }

    resumeAt.current = videoRef.current?.currentTime ?? 0;
    setRenewed(true);
    refetch();
  }

  async function download() {
    setIsDownloading(true);

    try {
      window.location.assign(await requestDownloadUrl());
    } catch (err) {
      notifyError(err);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="space-y-4">
      {mediaFailed ? (
        <PreviewMessage>
          Não foi possível exibir o arquivo aqui. Baixe o arquivo para abri-lo.
        </PreviewMessage>
      ) : (
        <FilePreview
          kind={kind}
          url={data.downloadUrl}
          fileName={attachment.fileName}
          videoRef={videoRef}
          onError={handleMediaError}
          onVideoLoadedMetadata={(event) => {
            if (resumeAt.current > 0) {
              event.currentTarget.currentTime = resumeAt.current;
              resumeAt.current = 0;
            }
          }}
        />
      )}

      <div className="flex justify-end">
        <Button
          type="button"
          variant="secondary"
          block={false}
          disabled={isDownloading}
          onClick={download}
        >
          {isDownloading ? "Preparando..." : "Baixar arquivo"}
        </Button>
      </div>
    </div>
  );
}

export default function AttachmentViewer({
  patientId,
  attachments,
  index,
  open,
  canViewMedia,
  onIndexChange,
  onClose,
}: Props) {
  const attachment = attachments[index];

  if (!attachment) {
    return null;
  }

  return (
    <PreviewDialog
      open={open}
      onClose={onClose}
      title="Anexo"
      fileName={attachment.fileName}
      size={attachment.size}
      index={index}
      total={attachments.length}
      onIndexChange={onIndexChange}
    >
      <AttachmentPreview
        key={attachment.id}
        patientId={patientId}
        attachment={attachment}
        canViewMedia={canViewMedia}
        onClose={onClose}
      />
    </PreviewDialog>
  );
}
