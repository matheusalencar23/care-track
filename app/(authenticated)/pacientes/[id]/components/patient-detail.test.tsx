import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Patient } from "@/model/patient";
import { getAttachmentDownload, listAttachments } from "@/services/attachment.service";
import { listConsents } from "@/services/consent.service";
import { getPatient } from "@/services/patient.service";
import { ApiError } from "@/shared/ApiError";
import { renderWithQueryClient } from "@/test/render";
import PatientDetail from "./patient-detail";

vi.mock("@/services/patient.service", () => ({
  getPatient: vi.fn(),
}));

vi.mock("@/services/consent.service", () => ({
  listConsents: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/services/record.service", () => ({
  listRecords: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
}));

vi.mock("@/services/attachment.service", () => ({
  listAttachments: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
  getAttachmentDownload: vi.fn(),
  uploadAttachment: vi.fn(),
}));

const id = "8f0c6d1e-0000-4000-8000-000000000001";

function patient(overrides: Partial<Patient> = {}): Patient {
  return {
    id,
    name: "Maria das Dores",
    birthDate: "1950-03-15",
    cpf: "52998224725",
    cns: "898001160660004",
    phone: "11987654321",
    archivedAt: null,
    createdAt: "2026-01-01T12:00:00.000Z",
    updatedAt: "2026-01-02T12:00:00.000Z",
    ...overrides,
  };
}

function field(label: string) {
  return screen.getByText(label, { selector: "dt" }).nextElementSibling as HTMLElement;
}

beforeEach(() => {
  vi.mocked(getPatient).mockReset();
});

describe("PatientDetail", () => {
  it("mostra os dados cadastrais com CPF e Cartão SUS mascarados", async () => {
    vi.mocked(getPatient).mockResolvedValue(patient());
    renderWithQueryClient(<PatientDetail id={id} />);

    expect(await screen.findByRole("heading", { level: 1, name: "Maria das Dores" })).toBeVisible();
    expect(getPatient).toHaveBeenCalledWith(id);
    expect(field("Data de nascimento")).toHaveTextContent(/^15\/03\/1950 \(\d+ anos\)$/);
    expect(field("CPF")).toHaveTextContent("***.982.247-**");
    expect(field("Cartão SUS")).toHaveTextContent("*** **** **** 0004");
    expect(field("Telefone")).toHaveTextContent("(11) 98765-4321");
    expect(screen.queryByText("529.982.247-25")).not.toBeInTheDocument();
    expect(screen.queryByText("Arquivado")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Editar" })).toHaveAttribute("href", `/pacientes/${id}/editar`);
  });

  it("mostra o CPF completo só quando pedido", async () => {
    vi.mocked(getPatient).mockResolvedValue(patient());
    renderWithQueryClient(<PatientDetail id={id} />);
    const toggle = await screen.findByRole("button", { name: "Mostrar CPF" });

    await userEvent.click(toggle);

    expect(field("CPF")).toHaveTextContent("529.982.247-25");
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(field("Cartão SUS")).toHaveTextContent("*** **** **** 0004");

    await userEvent.click(toggle);

    expect(field("CPF")).toHaveTextContent("***.982.247-**");
  });

  it("indica os opcionais não informados", async () => {
    vi.mocked(getPatient).mockResolvedValue(patient({ cpf: null, cns: null, phone: null }));
    renderWithQueryClient(<PatientDetail id={id} />);
    await screen.findByRole("heading", { level: 1 });

    for (const label of ["CPF", "Cartão SUS", "Telefone"]) {
      expect(field(label)).toHaveTextContent("Não informado");
    }
  });

  it("avisa que o paciente está arquivado", async () => {
    vi.mocked(getPatient).mockResolvedValue(patient({ archivedAt: "2026-10-01T12:00:00.000Z" }));
    renderWithQueryClient(<PatientDetail id={id} />);

    expect(await screen.findByText("Arquivado")).toBeVisible();
    expect(screen.getByText(/O prontuário continua guardado pelo prazo legal/)).toBeVisible();
    expect(screen.queryByRole("link", { name: "Editar" })).not.toBeInTheDocument();
  });

  it("mostra paciente não encontrado no 404 e no ID inválido", async () => {
    vi.mocked(getPatient).mockRejectedValue(
      new ApiError("Paciente não encontrado!", { statusCode: 404, code: "PATIENT_NOT_FOUND" }),
    );
    const { unmount } = renderWithQueryClient(<PatientDetail id={id} />);

    expect(await screen.findByRole("heading", { name: "Paciente não encontrado" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Voltar para pacientes" })).toHaveAttribute("href", "/pacientes");
    unmount();

    vi.mocked(getPatient).mockRejectedValue(
      new ApiError("Dados inválidos.", {
        statusCode: 422,
        code: "VALIDATION_FAILED",
        errors: [{ location: "params", path: "id", message: "ID de paciente inválido" }],
      }),
    );
    renderWithQueryClient(<PatientDetail id="abc" />);

    expect(await screen.findByRole("heading", { name: "Paciente não encontrado" })).toBeVisible();
  });

  it("mostra o erro com o código da requisição e tenta de novo", async () => {
    vi.mocked(getPatient)
      .mockRejectedValueOnce(new ApiError("Erro.", { statusCode: 500, requestId: "req-456" }))
      .mockResolvedValueOnce(patient());
    renderWithQueryClient(<PatientDetail id={id} />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("req-456");

    await userEvent.click(within(alert).getByRole("button", { name: "Tentar novamente" }));

    expect(await screen.findByRole("heading", { level: 1, name: "Maria das Dores" })).toBeVisible();
  });
});

describe("PatientDetail: organização da página", () => {
  const consent = {
    id: "c1",
    patientId: id,
    type: "image_capture" as const,
    method: "written" as const,
    grantor: "patient" as const,
    representativeName: null,
    collectedAt: "2026-03-01T12:00:00.000Z",
    status: "active" as const,
    needsRenewal: false,
    revokedAt: null,
    revocationReason: null,
    createdAt: "2026-03-01T12:00:00.000Z",
  };

  it("leva a autorização de imagem para uma página própria, com a situação no botão", async () => {
    vi.mocked(listConsents).mockResolvedValueOnce([consent]);
    vi.mocked(getPatient).mockResolvedValue(patient());
    renderWithQueryClient(<PatientDetail id={id} />);

    const link = await screen.findByRole("link", { name: "Autorização de imagem: Autorizado" });

    expect(link).toHaveAttribute("href", `/pacientes/${id}/autorizacoes`);
    expect(screen.queryByRole("region", { name: /autorização/i })).not.toBeInTheDocument();
  });

  it("recolhe e mostra os dados cadastrais", async () => {
    vi.mocked(getPatient).mockResolvedValue(patient());
    renderWithQueryClient(<PatientDetail id={id} />);
    const toggle = await screen.findByRole("button", { name: "Dados cadastrais" });

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(field("CPF")).toBeVisible();

    await userEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("CPF", { selector: "dt" })).not.toBeVisible();
    expect(screen.getByRole("heading", { level: 1, name: "Maria das Dores" })).toBeVisible();
  });

  it("começa com os dados recolhidos em tela pequena", async () => {
    vi.stubGlobal("matchMedia", (query: string) => ({ matches: false, media: query }));
    vi.mocked(getPatient).mockResolvedValue(patient());
    renderWithQueryClient(<PatientDetail id={id} />);

    expect(await screen.findByRole("button", { name: "Dados cadastrais" })).toHaveAttribute("aria-expanded", "false");
    vi.unstubAllGlobals();
  });

  it("não mostra o carrossel sem anexos", async () => {
    vi.mocked(getPatient).mockResolvedValue(patient());
    renderWithQueryClient(<PatientDetail id={id} />);
    await screen.findByRole("heading", { level: 1 });

    await vi.waitFor(() => expect(listAttachments).toHaveBeenCalled());
    expect(screen.queryByRole("region", { name: "Anexos" })).not.toBeInTheDocument();
  });

  it("abre o carrossel pela seção de anexos, carregando a página seguinte ao chegar no fim", async () => {
    const pdf = (n: number) => ({
      id: `anexo-${n}`,
      patientId: id,
      recordId: `registro-${n}`,
      fileName: `exame-${n}.pdf`,
      contentType: "application/pdf",
      size: 2048,
      sha256: "abc",
      createdAt: "2026-11-09T12:00:00.000Z",
    });
    vi.mocked(listAttachments)
      .mockResolvedValueOnce({ items: [pdf(1), pdf(2)], nextCursor: "anexo-2" })
      .mockResolvedValueOnce({ items: [pdf(3)], nextCursor: null });
    vi.mocked(getAttachmentDownload).mockImplementation(async (_patientId, attachmentId) => ({
      ...pdf(Number(attachmentId.split("-")[1])),
      downloadUrl: `https://storage.test/${attachmentId}`,
      downloadUrlExpiresAt: "2026-11-09T12:05:00.000Z",
    }));
    vi.mocked(getPatient).mockResolvedValue(patient());
    renderWithQueryClient(<PatientDetail id={id} />);

    const section = await screen.findByRole("region", { name: "Anexos" });
    expect(section).toHaveTextContent("Mais de 2 anexos");
    expect(listAttachments).toHaveBeenCalledExactlyOnceWith(id, { status: "active", cursor: undefined, limit: 20 });
    expect(getAttachmentDownload).not.toHaveBeenCalled();
    expect(section.querySelector("img")).toBeNull();

    await userEvent.click(within(section).getByRole("button", { name: "Ver anexos" }));

    const dialog = await screen.findByRole("dialog", { name: /^Anexo 1 de (2\+|3)$/ });
    expect(getAttachmentDownload).toHaveBeenCalledExactlyOnceWith(id, "anexo-1", "inline");
    await vi.waitFor(() =>
      expect(listAttachments).toHaveBeenLastCalledWith(id, { status: "active", cursor: "anexo-2", limit: 20 }),
    );

    expect(await screen.findByRole("dialog", { name: "Anexo 1 de 3" })).toBe(dialog);
    await userEvent.click(within(dialog).getByRole("button", { name: "Próximo" }));
    await userEvent.click(within(dialog).getByRole("button", { name: "Próximo" }));

    expect(dialog).toHaveAccessibleName("Anexo 3 de 3");
    expect(within(dialog).getByText(/Enviado em/)).toHaveTextContent(/^· 2 KB · Enviado em 09\/11\/2026, \d{2}:00$/);
    expect(within(dialog).getByText(/Enviado em/).querySelector("time")).toHaveAttribute(
      "datetime",
      "2026-11-09T12:00:00.000Z",
    );
    expect(await within(dialog).findByTitle("Documento: exame-3.pdf")).toBeVisible();
    expect(section).toHaveTextContent("3 anexos");
  });
});
