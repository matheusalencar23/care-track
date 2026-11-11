import { api } from "@/lib/api";
import type {
  Attachment,
  AttachmentDisposition,
  AttachmentDownload,
  AttachmentListParams,
  AttachmentPage,
  UploadAttachmentOptions,
} from "@/model/attachment";

function attachmentsPath(patientId: string) {
  return `/patients/${encodeURIComponent(patientId)}/attachments`;
}

export async function uploadAttachment(
  patientId: string,
  file: File,
  { signal, onProgress }: UploadAttachmentOptions = {},
): Promise<Attachment> {
  const body = new FormData();
  body.append("file", file);

  const response = await api.post(attachmentsPath(patientId), body, {
    signal,
    onUploadProgress: (event) => {
      const total = event.total ?? file.size;

      if (total > 0) {
        onProgress?.(Math.min(event.loaded / total, 1));
      }
    },
  });
  return response.data;
}

export async function getAttachmentDownload(
  patientId: string,
  attachmentId: string,
  disposition: AttachmentDisposition = "attachment",
): Promise<AttachmentDownload> {
  const response = await api.get(
    `${attachmentsPath(patientId)}/${encodeURIComponent(attachmentId)}/download`,
    disposition === "inline" ? { params: { disposition } } : undefined,
  );
  return response.data;
}

export async function listAttachments(
  patientId: string,
  params: AttachmentListParams,
): Promise<AttachmentPage> {
  const response = await api.get(attachmentsPath(patientId), { params });
  return response.data;
}
