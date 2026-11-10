import { describe, expect, it } from "vitest";
import { ATTACHMENT_MAX_SIZE_BYTES } from "@/model/attachment";
import {
  attachmentKind,
  formatFileSize,
  guessContentType,
  requiresImageConsent,
  validateAttachmentFile,
} from "./attachments";

function file(name: string, type = "", size = 10) {
  const result = new File(["x"], name, { type });
  Object.defineProperty(result, "size", { value: size });
  return result;
}

describe("formatFileSize", () => {
  it("usa unidades binárias com vírgula decimal", () => {
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(1536)).toBe("1,5 KB");
    expect(formatFileSize(ATTACHMENT_MAX_SIZE_BYTES)).toBe("200 MB");
  });
});

describe("guessContentType", () => {
  it("usa o tipo declarado quando é aceito e a extensão quando não há tipo", () => {
    expect(guessContentType(file("foto", "image/png"))).toBe("image/png");
    expect(guessContentType(file("video.MOV"))).toBe("video/quicktime");
    expect(guessContentType(file("planilha.xlsx"))).toBeNull();
  });
});

describe("attachmentKind e requiresImageConsent", () => {
  it("separa fotos e vídeos, que exigem autorização, de PDFs", () => {
    expect(attachmentKind("image/webp")).toBe("image");
    expect(attachmentKind("video/webm")).toBe("video");
    expect(attachmentKind("application/pdf")).toBe("pdf");
    expect(requiresImageConsent("image/jpeg")).toBe(true);
    expect(requiresImageConsent("video/mp4")).toBe(true);
    expect(requiresImageConsent("application/pdf")).toBe(false);
  });
});

describe("validateAttachmentFile", () => {
  it("aceita os formatos da API dentro do limite", () => {
    expect(validateAttachmentFile(file("exame.pdf", "application/pdf"))).toBeNull();
    expect(validateAttachmentFile(file("ferida.heic", "image/heic"))).toMatch(/Formato não aceito/);
  });

  it("recusa arquivo vazio, acima do limite e nome com caractere de controle", () => {
    expect(validateAttachmentFile(file("vazio.pdf", "application/pdf", 0))).toBe("O arquivo está vazio.");
    expect(validateAttachmentFile(file("grande.mp4", "video/mp4", ATTACHMENT_MAX_SIZE_BYTES + 1))).toBe(
      "O arquivo passa de 200 MB.",
    );
    expect(validateAttachmentFile(file("a\u0007.pdf", "application/pdf"))).toMatch(/caracteres inválidos/);
  });
});
