"use client";

import {
  guessContentType,
  requiresImageConsent,
  validateAttachmentFile,
} from "@/lib/attachments";
import { queryKeys } from "@/lib/query-keys";
import { RECORD_ATTACHMENTS_MAX, type Attachment } from "@/model/attachment";
import { uploadAttachment } from "@/services/attachment.service";
import { ApiError, hasErrorCode } from "@/shared/ApiError";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

export type UploadStatus =
  | "queued"
  | "uploading"
  | "done"
  | "failed"
  | "rejected";

export interface AttachmentUpload {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  attachment?: Attachment;
  error?: string;
  errorDetails?: unknown;
  needsConsent?: boolean;
}

interface Options {
  canAttachMedia?: boolean;
}

export const CONSENT_REQUIRED_MESSAGE =
  "Fotos e vídeos exigem uma autorização de uso de imagem ativa. Registre a autorização e envie de novo.";

const CANCELED_MESSAGE = "Envio cancelado.";

const GENERIC_UPLOAD_ERROR = "Não foi possível enviar o arquivo.";

const REJECTING_CODES = [
  "ATTACHMENT_TYPE_NOT_ALLOWED",
  "ATTACHMENT_CONTENT_INVALID",
  "ATTACHMENT_TOO_LARGE",
];

function isSameFile(a: File, b: File) {
  return (
    a.name === b.name && a.size === b.size && a.lastModified === b.lastModified
  );
}

function needsConsent(file: File, canAttachMedia: boolean | undefined) {
  return (
    canAttachMedia === false &&
    requiresImageConsent(guessContentType(file) ?? "")
  );
}

const consentFailure: Partial<AttachmentUpload> = {
  status: "failed",
  progress: 0,
  error: CONSENT_REQUIRED_MESSAGE,
  errorDetails: undefined,
  needsConsent: true,
};

export function useAttachmentUploads(
  patientId: string,
  { canAttachMedia }: Options = {},
) {
  const queryClient = useQueryClient();
  const [uploads, setUploads] = useState<AttachmentUpload[]>([]);
  const uploadsRef = useRef<AttachmentUpload[]>([]);
  const controllers = useRef(new Map<string, AbortController>());
  const activeId = useRef<string | null>(null);
  const sequence = useRef(0);

  useEffect(() => {
    const active = controllers.current;

    return () => {
      active.forEach((controller) => controller.abort());
    };
  }, []);

  function commit(change: (list: AttachmentUpload[]) => AttachmentUpload[]) {
    uploadsRef.current = change(uploadsRef.current);
    setUploads(uploadsRef.current);
  }

  function update(id: string, changes: Partial<AttachmentUpload>) {
    commit((list) =>
      list.map((upload) =>
        upload.id === id ? { ...upload, ...changes } : upload,
      ),
    );
  }

  function failure(err: unknown, signal: AbortSignal): Partial<AttachmentUpload> {
    if (signal.aborted) {
      return { status: "failed", progress: 0, error: CANCELED_MESSAGE };
    }

    if (hasErrorCode(err, "ATTACHMENT_CONSENT_REQUIRED")) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.patients.consents(patientId),
      });
      return consentFailure;
    }

    if (hasErrorCode(err, "PATIENT_ARCHIVED")) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.patients.detail(patientId),
      });
    }

    const rejected = REJECTING_CODES.some((code) => hasErrorCode(err, code));

    return {
      status: rejected ? "rejected" : "failed",
      progress: 0,
      error: err instanceof ApiError ? err.message : GENERIC_UPLOAD_ERROR,
      errorDetails: err,
    };
  }

  function finish(id: string, changes: Partial<AttachmentUpload>) {
    controllers.current.delete(id);
    activeId.current = null;
    update(id, changes);
    startNext();
  }

  function startNext() {
    if (activeId.current) {
      return;
    }

    const next = uploadsRef.current.find((upload) => upload.status === "queued");

    if (!next) {
      return;
    }

    const controller = new AbortController();
    activeId.current = next.id;
    controllers.current.set(next.id, controller);
    update(next.id, { status: "uploading", progress: 0 });

    uploadAttachment(patientId, next.file, {
      signal: controller.signal,
      onProgress: (progress) => update(next.id, { progress }),
    }).then(
      (attachment) =>
        finish(next.id, { status: "done", progress: 1, attachment }),
      (err: unknown) => finish(next.id, failure(err, controller.signal)),
    );
  }

  function addFiles(files: Iterable<File>) {
    const added: AttachmentUpload[] = [];
    const current = uploadsRef.current;

    for (const file of files) {
      const kept = [...current, ...added].filter(
        (upload) => upload.status !== "rejected",
      );

      if (kept.some((upload) => isSameFile(upload.file, file))) {
        continue;
      }

      sequence.current += 1;
      const base = { id: `upload-${sequence.current}`, file, progress: 0 };
      const problem =
        validateAttachmentFile(file) ??
        (kept.length >= RECORD_ATTACHMENTS_MAX
          ? `Um registro pode ter no máximo ${RECORD_ATTACHMENTS_MAX} anexos.`
          : null);

      if (problem) {
        added.push({ ...base, status: "rejected", error: problem });
      } else if (needsConsent(file, canAttachMedia)) {
        added.push({ ...base, ...consentFailure, status: "failed" });
      } else {
        added.push({ ...base, status: "queued" });
      }
    }

    if (added.length > 0) {
      commit((list) => [...list, ...added]);
      startNext();
    }
  }

  function cancel(id: string) {
    const upload = uploadsRef.current.find((item) => item.id === id);

    if (upload?.status === "queued") {
      update(id, { status: "failed", progress: 0, error: CANCELED_MESSAGE });
    }

    controllers.current.get(id)?.abort();
  }

  function retry(id: string) {
    const upload = uploadsRef.current.find((item) => item.id === id);

    if (!upload || upload.status !== "failed") {
      return;
    }

    if (needsConsent(upload.file, canAttachMedia)) {
      update(id, consentFailure);
      return;
    }

    update(id, {
      status: "queued",
      progress: 0,
      error: undefined,
      errorDetails: undefined,
      needsConsent: false,
    });
    startNext();
  }

  function remove(id: string) {
    controllers.current.get(id)?.abort();
    commit((list) => list.filter((upload) => upload.id !== id));
  }

  function reset() {
    controllers.current.forEach((controller) => controller.abort());
    commit(() => []);
  }

  return {
    uploads,
    addFiles,
    cancel,
    retry,
    remove,
    reset,
    isUploading: uploads.some(
      (upload) => upload.status === "queued" || upload.status === "uploading",
    ),
    hasProblems: uploads.some(
      (upload) => upload.status === "failed" || upload.status === "rejected",
    ),
    attachmentIds: uploads.flatMap((upload) =>
      upload.attachment ? [upload.attachment.id] : [],
    ),
  };
}
