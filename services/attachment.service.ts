import { api } from "@/lib/api";
import type {
  Attachment,
  AttachmentDownload,
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
): Promise<AttachmentDownload> {
  const response = await api.get(
    `${attachmentsPath(patientId)}/${encodeURIComponent(attachmentId)}/download`,
  );
  return response.data;
}
