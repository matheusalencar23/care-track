"use client";

import Button from "@/app/ui/button";
import RequestId from "@/app/ui/request-id";
import type { AttachmentUpload } from "@/hooks/attachments/useAttachmentUploads";
import {
  attachmentAccept,
  attachmentFormatsLabel,
  attachmentMaxSizeLabel,
  formatFileSize,
} from "@/lib/attachments";
import { RECORD_ATTACHMENTS_MAX } from "@/model/attachment";
import { useId, useRef, useState, type DragEvent } from "react";
import { FaPaperclip } from "react-icons/fa";
import ConsentPageLink from "./consent-page-link";
import UploadPreview, { canPreviewUpload } from "./upload-preview";

interface Props {
  patientId: string;
  uploads: AttachmentUpload[];
  disabled?: boolean;
  canAttachMedia?: boolean;
  onAddFiles: (files: File[]) => void;
  onCancel: (id: string) => void;
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
}

const actionClassName =
  "cursor-pointer rounded-lg px-2 py-1 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40";

function statusLabel(upload: AttachmentUpload) {
  switch (upload.status) {
    case "queued":
      return "Aguardando envio";
    case "uploading":
      return `Enviando... ${Math.round(upload.progress * 100)}%`;
    case "done":
      return "Enviado";
    default:
      return "Não enviado";
  }
}

function summary(uploads: AttachmentUpload[]) {
  if (uploads.length === 0) {
    return "";
  }

  const done = uploads.filter((upload) => upload.status === "done").length;
  const problems = uploads.filter(
    (upload) => upload.status === "failed" || upload.status === "rejected",
  ).length;
  const sent =
    uploads.length === 1
      ? `${done} de 1 arquivo enviado.`
      : `${done} de ${uploads.length} arquivos enviados.`;

  if (problems === 0) {
    return sent;
  }

  return `${sent} ${problems === 1 ? "1 arquivo não foi enviado." : `${problems} arquivos não foram enviados.`}`;
}

function UploadItem({
  upload,
  onCancel,
  onRetry,
  onRemove,
  onPreview,
  patientId,
}: {
  patientId: string;
  upload: AttachmentUpload;
  onCancel: () => void;
  onRetry: () => void;
  onRemove: () => void;
  onPreview?: () => void;
}) {
  const { file, status } = upload;
  const isActive = status === "queued" || status === "uploading";
  const hasError = status === "failed" || status === "rejected";

  return (
    <li className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="break-all text-sm font-medium">{file.name}</p>
          <p className="text-xs text-slate-300">
            {formatFileSize(file.size)} · {statusLabel(upload)}
          </p>
        </div>

        <div className="flex gap-1">
          {onPreview && (
            <button
              type="button"
              onClick={onPreview}
              aria-label={`Visualizar ${file.name}`}
              className={actionClassName}
            >
              Visualizar
            </button>
          )}
          {isActive && (
            <button
              type="button"
              onClick={onCancel}
              aria-label={`Cancelar envio de ${file.name}`}
              className={actionClassName}
            >
              Cancelar
            </button>
          )}
          {status === "failed" && (
            <button
              type="button"
              onClick={onRetry}
              aria-label={`Enviar de novo ${file.name}`}
              className={actionClassName}
            >
              Enviar de novo
            </button>
          )}
          {!isActive && (
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remover ${file.name}`}
              className={actionClassName}
            >
              Remover
            </button>
          )}
        </div>
      </div>

      {status === "uploading" && (
        <progress
          max={1}
          value={upload.progress}
          aria-label={`Envio de ${file.name}`}
          className="mt-2 block h-2 w-full overflow-hidden rounded-full [&::-moz-progress-bar]:bg-teal-300 [&::-webkit-progress-bar]:bg-white/10 [&::-webkit-progress-value]:bg-teal-300"
        />
      )}

      {hasError && upload.error && (
        <div className="mt-2 text-sm text-danger-400">
          <p>
            {upload.error}
            {upload.needsConsent && (
              <>
                {" "}
                <ConsentPageLink patientId={patientId}>
                  Registrar a autorização de uso de imagem
                </ConsentPageLink>
              </>
            )}
          </p>
          <RequestId error={upload.errorDetails} className="mt-1" />
        </div>
      )}
    </li>
  );
}

export default function AttachmentUploader({
  patientId,
  uploads,
  disabled = false,
  canAttachMedia,
  onAddFiles,
  onCancel,
  onRetry,
  onRemove,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const hintId = useId();

  function openPreview(id: string) {
    setPreviewId(id);
    setIsPreviewOpen(true);
  }

  function handleDragOver(event: DragEvent) {
    if (disabled || !event.dataTransfer.types.includes("Files")) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  }

  function handleDrop(event: DragEvent) {
    setIsDragging(false);

    if (disabled) {
      return;
    }

    event.preventDefault();
    onAddFiles(Array.from(event.dataTransfer.files));
  }

  return (
    <div className="mt-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`rounded-xl border border-dashed p-4 transition ${
          isDragging ? "border-teal-300 bg-teal-400/10" : "border-white/25"
        }`}
      >
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            block={false}
            disabled={disabled}
            aria-describedby={hintId}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2"
          >
            <FaPaperclip aria-hidden />
            Anexar arquivos
          </Button>
          <span className="hidden text-sm text-slate-300 sm:inline">
            ou arraste os arquivos para cá
          </span>
        </div>

        <div id={hintId} className="mt-3 space-y-1 text-xs text-slate-300">
          <p>
            {attachmentFormatsLabel}, até {attachmentMaxSizeLabel} cada e no
            máximo {RECORD_ATTACHMENTS_MAX} por registro.
          </p>
          {canAttachMedia === false && (
            <p className="text-warning-400">
              Fotos e vídeos exigem uma autorização de uso de imagem ativa.{" "}
              <ConsentPageLink patientId={patientId}>
                Registre a autorização
              </ConsentPageLink>{" "}
              para anexá-los. PDFs podem ser anexados.
            </p>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          accept={attachmentAccept}
          onChange={(event) => {
            onAddFiles(Array.from(event.target.files ?? []));
            event.target.value = "";
          }}
        />
      </div>

      {uploads.length > 0 && (
        <ul aria-label="Arquivos do novo registro" className="mt-3 space-y-2">
          {uploads.map((upload) => (
            <UploadItem
              key={upload.id}
              patientId={patientId}
              upload={upload}
              onCancel={() => onCancel(upload.id)}
              onRetry={() => onRetry(upload.id)}
              onRemove={() => onRemove(upload.id)}
              onPreview={
                canPreviewUpload(upload)
                  ? () => openPreview(upload.id)
                  : undefined
              }
            />
          ))}
        </ul>
      )}

      {previewId && (
        <UploadPreview
          uploads={uploads}
          uploadId={previewId}
          open={isPreviewOpen}
          onUploadChange={setPreviewId}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}

      <p aria-live="polite" className="sr-only">
        {summary(uploads)}
      </p>
    </div>
  );
}
