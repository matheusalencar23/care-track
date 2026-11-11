"use client";

import { useImageConsent } from "@/hooks/consents/useImageConsent";
import { attachmentKind, formatFileSize, type AttachmentKind } from "@/lib/attachments";
import type { Attachment } from "@/model/attachment";
import { useState } from "react";
import type { IconType } from "react-icons";
import { FaFile, FaFileImage, FaFilePdf, FaFileVideo } from "react-icons/fa";
import AttachmentViewer from "./attachment-viewer";

interface Props {
  patientId: string;
  attachments: Attachment[];
}

const attachmentKindIcons: Record<AttachmentKind, IconType> = {
  image: FaFileImage,
  video: FaFileVideo,
  pdf: FaFilePdf,
  file: FaFile,
};

export default function RecordAttachments({ patientId, attachments }: Props) {
  const canViewMedia = useImageConsent(patientId);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [hasOpenedViewer, setHasOpenedViewer] = useState(false);

  function openViewer(index: number) {
    setViewerIndex(index);
    setIsViewerOpen(true);
    setHasOpenedViewer(true);
  }

  return (
    <>
      <ul aria-label="Anexos" className="mt-3 flex flex-wrap gap-2">
        {attachments.map((attachment, index) => {
          const Icon = attachmentKindIcons[attachmentKind(attachment.contentType)];

          return (
            <li key={attachment.id} className="max-w-full">
              <button
                type="button"
                onClick={() => openViewer(index)}
                className="flex max-w-full cursor-pointer items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-left text-sm transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                <Icon aria-hidden className="shrink-0 text-teal-300" />
                <span className="sr-only">Abrir </span>
                <span className="truncate">{attachment.fileName}</span>
                <span className="shrink-0 text-xs text-slate-300">
                  {formatFileSize(attachment.size)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {hasOpenedViewer && (
        <AttachmentViewer
          patientId={patientId}
          attachments={attachments}
          index={viewerIndex}
          open={isViewerOpen}
          canViewMedia={canViewMedia}
          onIndexChange={setViewerIndex}
          onClose={() => setIsViewerOpen(false)}
        />
      )}
    </>
  );
}
