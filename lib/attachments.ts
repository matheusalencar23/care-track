import {
  ATTACHMENT_CONTENT_TYPES,
  ATTACHMENT_FILE_NAME_MAX_LENGTH,
  ATTACHMENT_MAX_SIZE_BYTES,
  type AttachmentContentType,
} from "@/model/attachment";

export type AttachmentKind = "image" | "video" | "pdf" | "file";

const extensionContentTypes: Record<string, AttachmentContentType> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  pdf: "application/pdf",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
};

export const attachmentAccept = [
  ...Object.keys(extensionContentTypes).map((extension) => `.${extension}`),
  ...ATTACHMENT_CONTENT_TYPES,
].join(",");

export const attachmentFormatsLabel = "JPEG, PNG, WebP, PDF, MP4, MOV ou WebM";

const fileSizeUnits = ["B", "KB", "MB", "GB"];

export function formatFileSize(bytes: number) {
  let value = bytes;
  let unit = 0;

  while (value >= 1024 && unit < fileSizeUnits.length - 1) {
    value /= 1024;
    unit += 1;
  }

  const formatted = value.toLocaleString("pt-BR", {
    maximumFractionDigits: unit === 0 || value >= 10 ? 0 : 1,
  });

  return `${formatted} ${fileSizeUnits[unit]}`;
}

export const attachmentMaxSizeLabel = formatFileSize(ATTACHMENT_MAX_SIZE_BYTES);

function isAllowedContentType(type: string): type is AttachmentContentType {
  return (ATTACHMENT_CONTENT_TYPES as readonly string[]).includes(type);
}

export function guessContentType(file: File): AttachmentContentType | null {
  if (isAllowedContentType(file.type)) {
    return file.type;
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

  return extensionContentTypes[extension] ?? null;
}

export function attachmentKind(contentType: string): AttachmentKind {
  if (contentType.startsWith("image/")) {
    return "image";
  }

  if (contentType.startsWith("video/")) {
    return "video";
  }

  return contentType === "application/pdf" ? "pdf" : "file";
}

export function requiresImageConsent(contentType: string) {
  const kind = attachmentKind(contentType);

  return kind === "image" || kind === "video";
}

export function validateAttachmentFile(file: File): string | null {
  if (!guessContentType(file)) {
    return `Formato não aceito. Envie ${attachmentFormatsLabel}.`;
  }

  if (file.size === 0) {
    return "O arquivo está vazio.";
  }

  if (file.size > ATTACHMENT_MAX_SIZE_BYTES) {
    return `O arquivo passa de ${attachmentMaxSizeLabel}.`;
  }

  const name = file.name.trim();

  if (!name || name.length > ATTACHMENT_FILE_NAME_MAX_LENGTH) {
    return `O nome do arquivo deve ter de 1 a ${ATTACHMENT_FILE_NAME_MAX_LENGTH} caracteres.`;
  }

  if (/\p{Cc}/u.test(name)) {
    return "O nome do arquivo tem caracteres inválidos. Renomeie o arquivo e tente de novo.";
  }

  return null;
}
