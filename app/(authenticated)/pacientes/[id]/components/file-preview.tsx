"use client";

import type { AttachmentKind } from "@/lib/attachments";
import Image from "next/image";
import type { ReactNode, Ref, SyntheticEvent } from "react";

interface Props {
  kind: AttachmentKind;
  url: string;
  fileName: string;
  videoRef?: Ref<HTMLVideoElement>;
  onError?: () => void;
  onVideoLoadedMetadata?: (event: SyntheticEvent<HTMLVideoElement>) => void;
}

export function PreviewMessage({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-white/10 bg-white/5 p-4">
      {children}
    </p>
  );
}

export default function FilePreview({
  kind,
  url,
  fileName,
  videoRef,
  onError,
  onVideoLoadedMetadata,
}: Props) {
  if (kind === "image") {
    return (
      <div className="relative h-[60vh] w-full overflow-hidden rounded-xl bg-black/40">
        <Image
          src={url}
          alt={`Imagem: ${fileName}`}
          fill
          unoptimized
          className="object-contain"
          onError={onError}
        />
      </div>
    );
  }

  if (kind === "video") {
    return (
      <video
        ref={videoRef}
        src={url}
        controls
        preload="metadata"
        onError={onError}
        onLoadedMetadata={onVideoLoadedMetadata}
        className="max-h-[60vh] w-full rounded-xl bg-black"
      >
        Seu navegador não reproduz este vídeo.
      </video>
    );
  }

  if (kind === "pdf") {
    return (
      <iframe
        src={url}
        title={`Documento: ${fileName}`}
        className="h-[65vh] w-full rounded-xl border border-white/10 bg-white"
      />
    );
  }

  return (
    <PreviewMessage>
      A pré-visualização deste formato não está disponível.
    </PreviewMessage>
  );
}
