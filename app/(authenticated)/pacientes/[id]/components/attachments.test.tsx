import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Attachment } from "@/model/attachment";
import type { Consent } from "@/model/consent";
import type { Patient } from "@/model/patient";
import type { PatientRecord } from "@/model/record";
import { getAttachmentDownload, uploadAttachment } from "@/services/attachment.service";
import { listConsents } from "@/services/consent.service";
import { createRecord, listRecords } from "@/services/record.service";
import { ApiError } from "@/shared/ApiError";
import { renderWithQueryClient } from "@/test/render";
import RecordsSection from "./records-section";

vi.mock("@/services/record.service", () => ({
  listRecords: vi.fn(),
  createRecord: vi.fn(),
  voidRecord: vi.fn(),
  updateRecord: vi.fn(),
  listRecordVersions: vi.fn(),
}));

vi.mock("@/services/consent.service", () => ({
  listConsents: vi.fn(),
}));

vi.mock("@/services/attachment.service", () => ({
  uploadAttachment: vi.fn(),
  getAttachmentDownload: vi.fn(),
}));

vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

const patientId = "8f0c6d1e-0000-4000-8000-000000000001";

const patient: Patient = {
  id: patientId,
  name: "Maria das Dores",
  birthDate: "1950-03-15",
  cpf: null,
  cns: null,
  phone: null,
  archivedAt: null,
  createdAt: "2026-01-01T12:00:00.000Z",
  updatedAt: "2026-01-01T12:00:00.000Z",
};

const activeConsent: Consent = {
  id: "c1",
  patientId,
  type: "image_capture",
  method: "written",
  grantor: "patient",
  representativeName: null,
  collectedAt: "2026-03-01T12:00:00.000Z",
  status: "active",
  needsRenewal: false,
  revokedAt: null,
  revocationReason: null,
  createdAt: "2026-03-01T12:00:00.000Z",
};

function attachment(id: string, overrides: Partial<Attachment> = {}): Attachment {
  return {
    id,
    patientId,
    recordId: null,
    fileName: `${id}.png`,
    contentType: "image/png",
    size: 2048,
    sha256: "abc",
    createdAt: "2026-11-09T12:00:00.000Z",
    ...overrides,
  };
}

function record(id: string, attachments: Attachment[]): PatientRecord {
  return {
    id,
    patientId,
    content: null,
    version: 1,
    author: { id: "autor-1", name: "Ana Souza", coren: "123456", corenState: "SP" },
    createdAt: "2026-11-09T12:00:00.000Z",
    editedAt: null,
    voidedAt: null,
    voidReason: null,
    voidReasonDetails: null,
    attachments,
  };
}

function file(name: string, type: string, size = 2048) {
  const result = new File(["conteúdo"], name, { type });
  Object.defineProperty(result, "size", { value: size });
  return result;
}

function fileInput() {
  return document.querySelector<HTMLInputElement>('input[type="file"]')!;
}

function uploadList() {
  return screen.getByRole("list", { name: "Arquivos do novo registro" });
}

function download(item: Attachment, url = `https://storage.test/${item.id}`) {
  return {
    ...item,
    downloadUrl: url,
    downloadUrlExpiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  };
}

beforeEach(() => {
  vi.mocked(listRecords).mockReset().mockResolvedValue({ items: [], nextCursor: null });
  vi.mocked(createRecord).mockReset();
  vi.mocked(listConsents).mockReset().mockResolvedValue([activeConsent]);
  vi.mocked(uploadAttachment).mockReset();
  vi.mocked(getAttachmentDownload).mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Novo registro com anexos", () => {
  it("envia o arquivo com progresso e salva o registro só com o anexo", async () => {
    let finishUpload: (value: Attachment) => void = () => {};
    vi.mocked(uploadAttachment).mockImplementation((_patientId, _file, options) => {
      options?.onProgress?.(0.4);
      return new Promise((resolve) => {
        finishUpload = resolve;
      });
    });
    vi.mocked(createRecord).mockResolvedValue(record("novo", [attachment("anexo-1")]));
    renderWithQueryClient(<RecordsSection patient={patient} />);
    await waitFor(() => expect(listConsents).toHaveBeenCalled());

    await userEvent.upload(fileInput(), file("ferida.png", "image/png"));

    expect(await screen.findByRole("progressbar", { name: "Envio de ferida.png" })).toHaveAttribute("value", "0.4");
    expect(screen.getByRole("button", { name: "Enviando arquivos..." })).toBeDisabled();
    expect(uploadAttachment).toHaveBeenCalledWith(patientId, expect.any(File), expect.anything());

    finishUpload(attachment("anexo-1"));
    expect(await within(uploadList()).findByText(/Enviado/)).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Salvar registro" }));

    await waitFor(() => expect(createRecord).toHaveBeenCalledWith(patientId, { attachmentIds: ["anexo-1"] }));
    await waitFor(() => expect(screen.queryByRole("list", { name: "Arquivos do novo registro" })).not.toBeInTheDocument());
  });

  it("envia texto e anexos juntos", async () => {
    vi.mocked(uploadAttachment).mockResolvedValue(attachment("anexo-1", { contentType: "application/pdf" }));
    vi.mocked(createRecord).mockResolvedValue(record("novo", []));
    renderWithQueryClient(<RecordsSection patient={patient} />);

    await userEvent.type(screen.getByRole("textbox", { name: "Novo registro" }), "Exame anexado.");
    await userEvent.upload(fileInput(), file("exame.pdf", "application/pdf"));
    await within(uploadList()).findByText(/Enviado/);
    await userEvent.click(screen.getByRole("button", { name: "Salvar registro" }));

    await waitFor(() =>
      expect(createRecord).toHaveBeenCalledWith(patientId, { content: "Exame anexado.", attachmentIds: ["anexo-1"] }),
    );
  });

  it("recusa formato e tamanho fora do aceito sem chamar a API", async () => {
    renderWithQueryClient(<RecordsSection patient={patient} />);

    await userEvent.upload(fileInput(), [
      file("planilha.xlsx", "application/vnd.ms-excel"),
      file("grande.mp4", "video/mp4", 300 * 1024 * 1024),
    ], { applyAccept: false });

    expect(within(uploadList()).getByText(/Formato não aceito/)).toBeVisible();
    expect(within(uploadList()).getByText("O arquivo passa de 200 MB.")).toBeVisible();
    expect(uploadAttachment).not.toHaveBeenCalled();
    expect(within(uploadList()).queryByRole("button", { name: /Enviar de novo/ })).not.toBeInTheDocument();
  });

  it("impede fotos e vídeos sem autorização ativa, mas aceita PDF", async () => {
    vi.mocked(listConsents).mockResolvedValue([{ ...activeConsent, needsRenewal: true }]);
    vi.mocked(uploadAttachment).mockResolvedValue(attachment("anexo-pdf", { contentType: "application/pdf" }));
    renderWithQueryClient(<RecordsSection patient={patient} />);

    expect(await screen.findByText(/Fotos e vídeos exigem uma autorização de uso de imagem ativa\./)).toBeVisible();

    await userEvent.upload(fileInput(), [file("ferida.jpg", "image/jpeg"), file("exame.pdf", "application/pdf")]);

    const list = uploadList();
    expect(within(list).getByText(/Registre a autorização e envie de novo/)).toBeVisible();
    expect(within(list).getByRole("link", { name: "Ir para a autorização de uso de imagem" })).toHaveAttribute(
      "href",
      "#patient-consent-title",
    );
    await waitFor(() => expect(uploadAttachment).toHaveBeenCalledTimes(1));
    expect(vi.mocked(uploadAttachment).mock.calls[0]?.[1].name).toBe("exame.pdf");
  });

  it("mostra a recusa da API por falta de autorização e recarrega as autorizações", async () => {
    vi.mocked(uploadAttachment).mockRejectedValue(
      new ApiError("Enviar ou abrir fotos e vídeos exige um consentimento.", {
        statusCode: 409,
        code: "ATTACHMENT_CONSENT_REQUIRED",
      }),
    );
    renderWithQueryClient(<RecordsSection patient={patient} />);
    await waitFor(() => expect(listConsents).toHaveBeenCalledTimes(1));

    await userEvent.upload(fileInput(), file("ferida.png", "image/png"));

    expect(await within(uploadList()).findByText(/Registre a autorização e envie de novo/)).toBeVisible();
    await waitFor(() => expect(listConsents).toHaveBeenCalledTimes(2));
  });

  it("cancela o envio e permite enviar de novo", async () => {
    vi.mocked(uploadAttachment)
      .mockImplementationOnce(
        (_patientId, _file, options) =>
          new Promise((_resolve, reject) => {
            options?.signal?.addEventListener("abort", () => reject(new Error("canceled")));
          }),
      )
      .mockResolvedValueOnce(attachment("anexo-1"));
    renderWithQueryClient(<RecordsSection patient={patient} />);
    await waitFor(() => expect(listConsents).toHaveBeenCalled());

    await userEvent.upload(fileInput(), file("ferida.png", "image/png"));
    await userEvent.click(await screen.findByRole("button", { name: "Cancelar envio de ferida.png" }));

    expect(await within(uploadList()).findByText("Envio cancelado.")).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Enviar de novo ferida.png" }));

    expect(await within(uploadList()).findByText(/Enviado/)).toBeVisible();
    expect(uploadAttachment).toHaveBeenCalledTimes(2);
  });

  it("não salva enquanto houver arquivo com erro", async () => {
    vi.mocked(uploadAttachment).mockRejectedValue(new ApiError("Erro.", { statusCode: 500, requestId: "req-up" }));
    renderWithQueryClient(<RecordsSection patient={patient} />);

    await userEvent.type(screen.getByRole("textbox", { name: "Novo registro" }), "Texto");
    await userEvent.upload(fileInput(), file("exame.pdf", "application/pdf"));
    expect(await within(uploadList()).findByText("req-up")).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Salvar registro" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Remova os arquivos que não foram enviados");
    expect(createRecord).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Remover exame.pdf" }));
    await userEvent.click(screen.getByRole("button", { name: "Salvar registro" }));

    await waitFor(() => expect(createRecord).toHaveBeenCalledWith(patientId, { content: "Texto" }));
  });
});

describe("Visualização dos anexos", () => {
  const photo = attachment("foto-1", { recordId: "r1", fileName: "ferida.png" });
  const video = attachment("video-1", { recordId: "r1", fileName: "curativo.mp4", contentType: "video/mp4" });
  const pdf = attachment("pdf-1", { recordId: "r1", fileName: "exame.pdf", contentType: "application/pdf" });

  async function openAttachment(name: RegExp) {
    const list = await screen.findByRole("list", { name: "Anexos" });
    await userEvent.click(within(list).getByRole("button", { name }));
    return screen.findByRole("dialog");
  }

  it("só busca a URL ao abrir e navega entre os anexos do registro", async () => {
    vi.mocked(listRecords).mockResolvedValue({ items: [record("r1", [photo, video])], nextCursor: null });
    vi.mocked(getAttachmentDownload).mockImplementation(async (_patientId, attachmentId) =>
      download(attachmentId === photo.id ? photo : video),
    );
    renderWithQueryClient(<RecordsSection patient={patient} />);
    await screen.findByRole("list", { name: "Anexos" });

    expect(getAttachmentDownload).not.toHaveBeenCalled();

    const dialog = await openAttachment(/ferida\.png/);

    expect(within(dialog).getByRole("heading", { name: "Anexo 1 de 2" })).toBeVisible();
    expect(await within(dialog).findByRole("img", { name: "Imagem anexada: ferida.png" })).toHaveAttribute(
      "src",
      "https://storage.test/foto-1",
    );
    expect(getAttachmentDownload).toHaveBeenCalledWith(patientId, photo.id);

    await userEvent.click(within(dialog).getByRole("button", { name: "Próximo" }));

    await waitFor(() => expect(dialog.querySelector("video")).toHaveAttribute("src", "https://storage.test/video-1"));
    expect(within(dialog).getByRole("heading", { name: "Anexo 2 de 2" })).toBeVisible();
  });

  it("explica que fotos e vídeos dependem de autorização, sem pedir a URL", async () => {
    vi.mocked(listConsents).mockResolvedValue([]);
    vi.mocked(listRecords).mockResolvedValue({ items: [record("r1", [photo])], nextCursor: null });
    renderWithQueryClient(<RecordsSection patient={patient} />);
    await waitFor(() => expect(listConsents).toHaveBeenCalled());

    const dialog = await openAttachment(/ferida\.png/);

    expect(within(dialog).getByText(/depende de uma autorização de uso de imagem ativa/)).toBeVisible();
    expect(getAttachmentDownload).not.toHaveBeenCalled();
  });

  it("mostra o mesmo aviso quando a API recusa por falta de autorização", async () => {
    vi.mocked(listRecords).mockResolvedValue({ items: [record("r1", [photo])], nextCursor: null });
    vi.mocked(getAttachmentDownload).mockRejectedValue(
      new ApiError("Exige consentimento.", { statusCode: 409, code: "ATTACHMENT_CONSENT_REQUIRED" }),
    );
    renderWithQueryClient(<RecordsSection patient={patient} />);
    await waitFor(() => expect(listConsents).toHaveBeenCalled());

    const dialog = await openAttachment(/ferida\.png/);

    expect(await within(dialog).findByText(/depende de uma autorização de uso de imagem ativa/)).toBeVisible();
    expect(within(dialog).queryByRole("alert")).not.toBeInTheDocument();
  });

  it("oferece baixar o PDF pela URL assinada", async () => {
    const assign = vi.fn();
    vi.stubGlobal("location", { ...window.location, assign });
    vi.mocked(listRecords).mockResolvedValue({ items: [record("r1", [pdf])], nextCursor: null });
    vi.mocked(getAttachmentDownload).mockResolvedValue(download(pdf));
    renderWithQueryClient(<RecordsSection patient={patient} />);

    const dialog = await openAttachment(/exame\.pdf/);

    expect(await within(dialog).findByText(/pré-visualização deste formato ainda não está disponível/)).toBeVisible();
    await userEvent.click(within(dialog).getByRole("button", { name: "Baixar arquivo" }));

    expect(assign).toHaveBeenCalledWith("https://storage.test/pdf-1");
    expect(getAttachmentDownload).toHaveBeenCalledTimes(1);
  });

  it("mostra o erro com o código da requisição e tenta de novo", async () => {
    vi.mocked(listRecords).mockResolvedValue({ items: [record("r1", [pdf])], nextCursor: null });
    vi.mocked(getAttachmentDownload)
      .mockRejectedValueOnce(new ApiError("Erro.", { statusCode: 500, requestId: "req-dl" }))
      .mockResolvedValueOnce(download(pdf));
    renderWithQueryClient(<RecordsSection patient={patient} />);

    const dialog = await openAttachment(/exame\.pdf/);

    expect(await within(dialog).findByRole("alert")).toHaveTextContent("req-dl");
    await userEvent.click(within(dialog).getByRole("button", { name: "Tentar novamente" }));

    expect(await within(dialog).findByRole("button", { name: "Baixar arquivo" })).toBeVisible();
  });
});
