"use client";

import Button from "@/app/ui/button";
import RequestId from "@/app/ui/request-id";
import { useAttachments } from "@/hooks/attachments/useAttachments";
import { useImageConsent } from "@/hooks/consents/useImageConsent";
import type { Patient } from "@/model/patient";
import { useEffect, useState } from "react";
import { FaChevronRight, FaPaperclip } from "react-icons/fa";
import AttachmentViewer from "./attachment-viewer";

interface Props {
  patient: Patient;
}

const cardClassName =
  "rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-2xl sm:p-8";

function countLabel(count: number, hasMore: boolean) {
  if (hasMore) {
    return `Mais de ${count} anexos`;
  }

  return count === 1 ? "1 anexo" : `${count} anexos`;
}

export default function PatientAttachments({ patient }: Props) {
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
    refetch,
  } = useAttachments(patient.id);
  const canViewMedia = useImageConsent(patient.id);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [hasOpenedViewer, setHasOpenedViewer] = useState(false);

  const attachments = data?.pages.flatMap((page) => page.items) ?? [];
  const isNearEnd = viewerIndex >= attachments.length - 2;

  useEffect(() => {
    if (isViewerOpen && isNearEnd && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [isViewerOpen, isNearEnd, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isPending || (!error && attachments.length === 0)) {
    return null;
  }

  function openViewer() {
    setViewerIndex(0);
    setIsViewerOpen(true);
    setHasOpenedViewer(true);
  }

  if (attachments.length === 0) {
    return (
      <section aria-labelledby="patient-attachments-title" className={cardClassName}>
        <h2 id="patient-attachments-title" className="text-lg font-semibold">
          Anexos
        </h2>
        <div role="alert" className="mt-4 space-y-3 text-sm">
          <p>Não foi possível carregar os anexos.</p>
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
      </section>
    );
  }

  return (
    <section
      aria-labelledby="patient-attachments-title"
      className={`${cardClassName} relative transition hover:bg-white/15`}
    >
      <div className="flex items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-400/15">
          <FaPaperclip aria-hidden className="text-xl text-teal-300" />
        </span>

        <div className="min-w-0 flex-1">
          <h2 id="patient-attachments-title" className="text-lg font-semibold">
            Anexos
          </h2>
          <p className="text-sm text-slate-300">
            {countLabel(attachments.length, Boolean(hasNextPage))}
            <span className="hidden sm:inline">
              {" "}
              · fotos, vídeos e documentos dos registros
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={openViewer}
          className="flex shrink-0 cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 after:absolute after:inset-0 after:rounded-3xl after:content-['']"
        >
          <span className="sr-only sm:not-sr-only">Ver anexos</span>
          <FaChevronRight aria-hidden className="text-xs" />
        </button>
      </div>

      {error && !isFetchingNextPage && (
        <div role="alert" className="relative z-10 mt-3 space-y-2 text-sm">
          <p>Não foi possível carregar mais anexos.</p>
          <RequestId error={error} />
        </div>
      )}

      {hasOpenedViewer && (
        <AttachmentViewer
          patientId={patient.id}
          attachments={attachments}
          index={viewerIndex}
          open={isViewerOpen}
          canViewMedia={canViewMedia}
          hasMore={Boolean(hasNextPage)}
          onIndexChange={setViewerIndex}
          onClose={() => setIsViewerOpen(false)}
        />
      )}
    </section>
  );
}
