"use client";

import Button from "@/app/ui/button";
import Modal from "@/app/ui/modal";
import RequestId from "@/app/ui/request-id";
import Skeleton from "@/app/ui/skeleton";
import { useAttachmentDownload } from "@/hooks/attachments/useAttachmentDownload";
import {
  attachmentKind,
  formatFileSize,
  requiresImageConsent,
} from "@/lib/attachments";
import {
  ATTACHMENT_DOWNLOAD_URL_TTL_MS,
  type Attachment,
} from "@/model/attachment";
import { hasErrorCode } from "@/shared/ApiError";
import Image from "next/image";
import { useRef, useState } from "react";
import { CONSENT_SECTION_ANCHOR } from "./attachment-uploader";

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

const URL_SAFETY_MARGIN_MS = 30_000;

const boxClassName = "rounded-xl border p-4";

function ConsentRequired({ onClose }: { onClose: () => void }) {
  return (
    <div
      className={`${boxClassName} border-warning-400/30 bg-warning-500/10`}
    >
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
  const { data, dataUpdatedAt, error, isConsentRequired, isPending, refetch } =
    useAttachmentDownload(patientId, attachment.id, { enabled: !blocked });
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
      const isFresh =
        Date.now() - dataUpdatedAt <
        ATTACHMENT_DOWNLOAD_URL_TTL_MS - URL_SAFETY_MARGIN_MS;
      const url = isFresh ? data?.downloadUrl : (await refetch()).data?.downloadUrl;

      if (url) {
        window.location.assign(url);
      }
    } finally {
      setIsDownloading(false);
    }
  }

  const downloadButton = (
    <Button
      type="button"
      variant="secondary"
      block={false}
      disabled={isDownloading}
      onClick={download}
    >
      {isDownloading ? "Preparando..." : "Baixar arquivo"}
    </Button>
  );

  return (
    <div className="space-y-4">
      {mediaFailed || (kind !== "image" && kind !== "video") ? (
        <p className={`${boxClassName} border-white/10 bg-white/5`}>
          {mediaFailed
            ? "Não foi possível exibir o arquivo aqui. Baixe o arquivo para abri-lo."
            : "A pré-visualização deste formato ainda não está disponível. Baixe o arquivo para abri-lo."}
        </p>
      ) : kind === "image" ? (
        <div className="relative h-[60vh] w-full overflow-hidden rounded-xl bg-black/40">
          <Image
            src={data.downloadUrl}
            alt={`Imagem anexada: ${attachment.fileName}`}
            fill
            unoptimized
            className="object-contain"
            onError={handleMediaError}
          />
        </div>
      ) : (
        <video
          ref={videoRef}
          src={data.downloadUrl}
          controls
          preload="metadata"
          onError={handleMediaError}
          onLoadedMetadata={(event) => {
            if (resumeAt.current > 0) {
              event.currentTarget.currentTime = resumeAt.current;
              resumeAt.current = 0;
            }
          }}
          className="max-h-[60vh] w-full rounded-xl bg-black"
        >
          Seu navegador não reproduz este vídeo. Baixe o arquivo para assistir.
        </video>
      )}

      <div className="flex justify-end">{downloadButton}</div>
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
  const total = attachments.length;

  if (!attachment) {
    return null;
  }

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
      title={total > 1 ? `Anexo ${index + 1} de ${total}` : "Anexo"}
      footer={footer}
    >
      <p className="mb-4 break-all">
        <span className="font-semibold text-white">{attachment.fileName}</span>
        <span className="text-slate-300">
          {" · "}
          {formatFileSize(attachment.size)}
        </span>
      </p>

      {open && (
        <AttachmentPreview
          key={attachment.id}
          patientId={patientId}
          attachment={attachment}
          canViewMedia={canViewMedia}
          onClose={onClose}
        />
      )}
    </Modal>
  );
}
