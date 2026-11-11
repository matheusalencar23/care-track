export const ATTACHMENT_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "video/mp4",
  "video/quicktime",
  "video/webm",
] as const;

export type AttachmentContentType = (typeof ATTACHMENT_CONTENT_TYPES)[number];

export const ATTACHMENT_MAX_SIZE_BYTES = 200 * 1024 * 1024;

export const ATTACHMENT_FILE_NAME_MAX_LENGTH = 255;

export const RECORD_ATTACHMENTS_MAX = 20;

export type AttachmentDisposition = "attachment" | "inline";

export interface Attachment {
  id: string;
  patientId: string;
  recordId: string | null;
  fileName: string;
  contentType: string;
  size: number;
  sha256: string;
  createdAt: string;
}

export interface AttachmentPage {
  items: Attachment[];
  nextCursor: string | null;
}

export interface AttachmentListParams {
  status: "active" | "voided";
  cursor?: string;
  limit: number;
}

export interface AttachmentDownload extends Attachment {
  downloadUrl: string;
  downloadUrlExpiresAt: string;
}

export interface UploadAttachmentOptions {
  signal?: AbortSignal;
  onProgress?: (fraction: number) => void;
}
