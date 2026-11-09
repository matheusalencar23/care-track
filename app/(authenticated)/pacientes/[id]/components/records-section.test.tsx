import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Patient } from "@/model/patient";
import { RECORD_CONTENT_MAX_LENGTH, type PatientRecord } from "@/model/record";
import { queryKeys } from "@/lib/query-keys";
import { createRecord, listRecords, voidRecord } from "@/services/record.service";
import { ApiError } from "@/shared/ApiError";
import { createTestQueryClient, renderWithQueryClient } from "@/test/render";
import { toast } from "react-toastify";
import RecordsSection from "./records-section";

vi.mock("@/services/record.service", () => ({
  listRecords: vi.fn(),
  createRecord: vi.fn(),
  voidRecord: vi.fn(),
}));

vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
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

function record(id: string, overrides: Partial<PatientRecord> = {}): PatientRecord {
  return {
    id,
    patientId,
    content: `Texto ${id}`,
    version: 1,
    author: { id: "autor-1", name: "Ana Souza", coren: "123456", corenState: "SP" },
    createdAt: "2026-11-09T12:00:00.000Z",
    editedAt: null,
    voidedAt: null,
    voidReason: null,
    voidReasonDetails: null,
    attachments: [],
    ...overrides,
  };
}

function textarea() {
  return screen.getByRole("textbox", { name: "Novo registro" });
}

function saveButton() {
  return screen.getByRole("button", { name: "Salvar registro" });
}

beforeEach(() => {
  vi.mocked(listRecords).mockReset();
  vi.mocked(createRecord).mockReset();
  vi.mocked(voidRecord).mockReset();
  vi.mocked(toast.success).mockReset();
  vi.mocked(toast.error).mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("RecordsSection: linha do tempo", () => {
  it("mostra os registros na ordem da API, com a autoria e as quebras de linha", async () => {
    vi.mocked(listRecords).mockResolvedValue({
      items: [record("b", { content: "Linha 1\nLinha 2" }), record("a")],
      nextCursor: null,
    });
    renderWithQueryClient(<RecordsSection patient={patient} />);

    const items = await screen.findAllByRole("listitem");

    expect(listRecords).toHaveBeenCalledWith(patientId, { status: "active", cursor: undefined, limit: 20 });
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("Ana Souza");
    expect(items[0]).toHaveTextContent("COREN-SP 123456");
    expect(within(items[0]).getByText(/Linha 1/).textContent).toBe("Linha 1\nLinha 2");
    expect(items[1]).toHaveTextContent("Texto a");
    expect(screen.queryByRole("button", { name: "Carregar registros anteriores" })).not.toBeInTheDocument();
  });

  it("indica quando o histórico está vazio", async () => {
    vi.mocked(listRecords).mockResolvedValue({ items: [], nextCursor: null });
    renderWithQueryClient(<RecordsSection patient={patient} />);

    expect(await screen.findByText("Nenhum registro neste histórico.")).toBeVisible();
  });

  it("aceita registro só com anexos, sem texto", async () => {
    const attachment = {
      id: "anexo-1",
      patientId,
      recordId: "a",
      fileName: "foto.jpg",
      contentType: "image/jpeg",
      size: 10,
      sha256: "abc",
      createdAt: "2026-11-09T12:00:00.000Z",
    };
    vi.mocked(listRecords).mockResolvedValue({
      items: [record("a", { content: null, attachments: [attachment] })],
      nextCursor: null,
    });
    renderWithQueryClient(<RecordsSection patient={patient} />);

    expect(await screen.findByText(/^1 anexo\./)).toBeVisible();
    expect(screen.queryByText("foto.jpg")).not.toBeInTheDocument();
  });

  it("mostra o erro com o código da requisição e tenta de novo", async () => {
    vi.mocked(listRecords)
      .mockRejectedValueOnce(new ApiError("Erro.", { statusCode: 500, requestId: "req-789" }))
      .mockResolvedValueOnce({ items: [record("a")], nextCursor: null });
    renderWithQueryClient(<RecordsSection patient={patient} />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("req-789");

    await userEvent.click(within(alert).getByRole("button", { name: "Tentar novamente" }));

    expect(await screen.findByText("Texto a")).toBeVisible();
  });

  it("carrega a página seguinte pelo botão, com o cursor da anterior", async () => {
    vi.mocked(listRecords)
      .mockResolvedValueOnce({ items: [record("b")], nextCursor: "b" })
      .mockResolvedValueOnce({ items: [record("a")], nextCursor: null });
    renderWithQueryClient(<RecordsSection patient={patient} />);

    await userEvent.click(await screen.findByRole("button", { name: "Carregar registros anteriores" }));

    expect(await screen.findByText("Texto a")).toBeVisible();
    expect(screen.getByText("Texto b")).toBeVisible();
    expect(listRecords).toHaveBeenLastCalledWith(patientId, { status: "active", cursor: "b", limit: 20 });
    expect(screen.queryByRole("button", { name: "Carregar registros anteriores" })).not.toBeInTheDocument();
  });

  it("carrega a página seguinte ao chegar no fim da lista", async () => {
    let notify: (entries: { isIntersecting: boolean }[]) => void = () => {};
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: typeof notify) {
          notify = callback;
        }
        observe() {}
        disconnect() {}
      },
    );
    vi.mocked(listRecords)
      .mockResolvedValueOnce({ items: [record("b")], nextCursor: "b" })
      .mockResolvedValueOnce({ items: [record("a")], nextCursor: null });
    renderWithQueryClient(<RecordsSection patient={patient} />);
    await screen.findByText("Texto b");

    act(() => notify([{ isIntersecting: false }]));
    expect(listRecords).toHaveBeenCalledTimes(1);

    act(() => notify([{ isIntersecting: true }]));

    expect(await screen.findByText("Texto a")).toBeVisible();
    expect(listRecords).toHaveBeenLastCalledWith(patientId, { status: "active", cursor: "b", limit: 20 });
  });

  it("mantém os registros e permite tentar de novo se a página seguinte falhar", async () => {
    vi.mocked(listRecords)
      .mockResolvedValueOnce({ items: [record("b")], nextCursor: "b" })
      .mockRejectedValueOnce(new ApiError("Erro.", { statusCode: 500, requestId: "req-next" }))
      .mockResolvedValueOnce({ items: [record("a")], nextCursor: null });
    renderWithQueryClient(<RecordsSection patient={patient} />);

    await userEvent.click(await screen.findByRole("button", { name: "Carregar registros anteriores" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("req-next");
    expect(screen.getByText("Texto b")).toBeVisible();

    await userEvent.click(within(alert).getByRole("button", { name: "Tentar novamente" }));

    expect(await screen.findByText("Texto a")).toBeVisible();
    expect(listRecords).toHaveBeenLastCalledWith(patientId, { status: "active", cursor: "b", limit: 20 });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("RecordsSection: novo registro", () => {
  beforeEach(() => {
    vi.mocked(listRecords).mockResolvedValue({ items: [], nextCursor: null });
  });

  it("envia só o texto, sem espaços nas pontas, limpa o campo e atualiza a lista", async () => {
    vi.mocked(createRecord).mockResolvedValue(record("novo"));
    renderWithQueryClient(<RecordsSection patient={patient} />);
    await screen.findByText("Nenhum registro neste histórico.");

    await userEvent.type(textarea(), "  Curativo trocado  ");
    vi.mocked(listRecords).mockResolvedValue({ items: [record("novo")], nextCursor: null });
    await userEvent.click(saveButton());

    await waitFor(() => expect(textarea()).toHaveValue(""));
    expect(vi.mocked(createRecord).mock.calls[0]).toEqual([patientId, { content: "Curativo trocado" }]);
    expect(toast.success).toHaveBeenCalledWith("Registro salvo.");
    expect(await screen.findByText("Texto novo")).toBeVisible();
    expect(textarea()).toHaveFocus();
  });

  it("não envia texto vazio nem só com espaços", async () => {
    renderWithQueryClient(<RecordsSection patient={patient} />);

    await userEvent.type(textarea(), "   ");
    await userEvent.click(saveButton());

    expect(await screen.findByText("Escreva o texto do registro")).toBeVisible();
    expect(createRecord).not.toHaveBeenCalled();
  });

  it("recusa texto acima do limite sem cortar o que foi digitado", async () => {
    const tooLong = "a".repeat(RECORD_CONTENT_MAX_LENGTH + 1);
    renderWithQueryClient(<RecordsSection patient={patient} />);

    await userEvent.click(textarea());
    await userEvent.paste(tooLong);
    await userEvent.click(saveButton());

    expect(await screen.findByText("O registro deve ter no máximo 20.000 caracteres")).toBeVisible();
    expect(textarea()).toHaveValue(tooLong);
    expect(createRecord).not.toHaveBeenCalled();
  });

  it("leva o erro de validação da API para o campo", async () => {
    vi.mocked(createRecord).mockRejectedValue(
      new ApiError("Dados inválidos.", {
        statusCode: 422,
        code: "VALIDATION_FAILED",
        errors: [{ location: "body", path: "content", message: "Conteúdo inválido" }],
      }),
    );
    renderWithQueryClient(<RecordsSection patient={patient} />);

    await userEvent.type(textarea(), "Texto");
    await userEvent.click(saveButton());

    expect(await screen.findByText("Conteúdo inválido")).toBeVisible();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("mantém o texto quando o envio falha", async () => {
    vi.mocked(createRecord).mockRejectedValue(new ApiError("Erro.", { statusCode: 500 }));
    renderWithQueryClient(<RecordsSection patient={patient} />);

    await userEvent.type(textarea(), "Texto importante");
    await userEvent.click(saveButton());

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(textarea()).toHaveValue("Texto importante");
    expect(saveButton()).toBeEnabled();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("não oferece o formulário para paciente arquivado", async () => {
    renderWithQueryClient(
      <RecordsSection patient={{ ...patient, archivedAt: "2026-10-01T12:00:00.000Z" }} />,
    );

    expect(await screen.findByText("Nenhum registro neste histórico.")).toBeVisible();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Salvar registro" })).not.toBeInTheDocument();
  });

  it("preserva o texto se o paciente for arquivado durante a escrita", async () => {
    vi.mocked(createRecord).mockRejectedValue(
      new ApiError("Paciente arquivado.", { statusCode: 409, code: "PATIENT_ARCHIVED" }),
    );
    const queryClient = createTestQueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { rerender } = renderWithQueryClient(<RecordsSection patient={patient} />, queryClient);

    await userEvent.type(textarea(), "Texto importante");
    await userEvent.click(saveButton());

    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.patients.detail(patientId) }),
    );

    rerender(<RecordsSection patient={{ ...patient, archivedAt: "2026-11-09T12:00:00.000Z" }} />);

    expect(textarea()).toHaveValue("Texto importante");
    expect(textarea()).toHaveAttribute("readonly");
    expect(saveButton()).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent("este texto ainda não foi salvo");
  });
});

describe("RecordsSection: anulação", () => {
  const voidedRecord = record("anulado", {
    content: "Texto anulado",
    voidedAt: "2026-11-09T15:00:00.000Z",
    voidReason: "other",
    voidReasonDetails: "Lançado no horário errado",
  });

  async function openVoidDialog() {
    await userEvent.click(await screen.findByRole("button", { name: /^Anular registro de / }));
    return screen.getByRole("dialog", { name: "Anular registro?" });
  }

  beforeEach(() => {
    vi.mocked(listRecords).mockImplementation(async (_id, { status }) =>
      status === "voided"
        ? { items: [voidedRecord], nextCursor: null }
        : { items: [record("a")], nextCursor: null },
    );
  });

  it("explica que é definitiva, mostra o registro e começa com o foco em Cancelar", async () => {
    renderWithQueryClient(<RecordsSection patient={patient} />);

    const dialog = await openVoidDialog();

    expect(dialog).toHaveTextContent("definitiva");
    expect(dialog).toHaveTextContent("Texto a");
    expect(within(dialog).getByRole("button", { name: "Cancelar" })).toHaveFocus();
  });

  it("exige o motivo e a descrição quando o motivo é outro", async () => {
    renderWithQueryClient(<RecordsSection patient={patient} />);
    const dialog = await openVoidDialog();

    await userEvent.click(within(dialog).getByRole("button", { name: "Anular" }));
    expect(await within(dialog).findByText("Informe o motivo da anulação")).toBeVisible();

    await userEvent.click(within(dialog).getByRole("radio", { name: "Outro motivo" }));
    await userEvent.type(within(dialog).getByRole("textbox", { name: "Descrição" }), "   ");
    await userEvent.click(within(dialog).getByRole("button", { name: "Anular" }));

    expect(await within(dialog).findByText("Descreva o motivo da anulação")).toBeVisible();
    expect(voidRecord).not.toHaveBeenCalled();
  });

  it("anula com o motivo, sem descrição vazia, e devolve o foco à lista", async () => {
    vi.mocked(voidRecord).mockResolvedValue(voidedRecord);
    renderWithQueryClient(<RecordsSection patient={patient} />);
    const dialog = await openVoidDialog();

    await userEvent.click(within(dialog).getByRole("radio", { name: "Registro duplicado" }));
    vi.mocked(listRecords).mockResolvedValue({ items: [], nextCursor: null });
    await userEvent.click(within(dialog).getByRole("button", { name: "Anular" }));

    await waitFor(() => expect(dialog).not.toHaveAttribute("open"));
    expect(vi.mocked(voidRecord).mock.calls[0]).toEqual([patientId, { recordId: "a", reason: "duplicate" }]);
    expect(toast.success).toHaveBeenCalledWith("Registro anulado.");
    expect(screen.getByRole("heading", { name: "Registros" })).toHaveFocus();
    expect(await screen.findByText("Nenhum registro neste histórico.")).toBeVisible();
  });

  it("envia a descrição sem espaços nas pontas", async () => {
    vi.mocked(voidRecord).mockResolvedValue(voidedRecord);
    renderWithQueryClient(<RecordsSection patient={patient} />);
    const dialog = await openVoidDialog();

    await userEvent.click(within(dialog).getByRole("radio", { name: "Outro motivo" }));
    await userEvent.type(within(dialog).getByRole("textbox", { name: "Descrição" }), "  Horário errado  ");
    await userEvent.click(within(dialog).getByRole("button", { name: "Anular" }));

    await waitFor(() =>
      expect(voidRecord).toHaveBeenCalledWith(patientId, {
        recordId: "a",
        reason: "other",
        details: "Horário errado",
      }),
    );
  });

  it("mantém o diálogo aberto quando a anulação falha", async () => {
    vi.mocked(voidRecord).mockRejectedValue(new ApiError("Erro.", { statusCode: 500 }));
    renderWithQueryClient(<RecordsSection patient={patient} />);
    const dialog = await openVoidDialog();

    await userEvent.click(within(dialog).getByRole("radio", { name: "Registro duplicado" }));
    await userEvent.click(within(dialog).getByRole("button", { name: "Anular" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(dialog).toHaveAttribute("open");
    expect(within(dialog).getByRole("button", { name: "Anular" })).toBeEnabled();
  });

  it("fecha e recarrega a lista se o registro já tiver sido anulado em outra aba", async () => {
    vi.mocked(voidRecord).mockRejectedValue(
      new ApiError("Este registro já foi anulado.", { statusCode: 409, code: "RECORD_ALREADY_VOIDED" }),
    );
    renderWithQueryClient(<RecordsSection patient={patient} />);
    const dialog = await openVoidDialog();
    const callsBefore = vi.mocked(listRecords).mock.calls.length;

    await userEvent.click(within(dialog).getByRole("radio", { name: "Registro duplicado" }));
    await userEvent.click(within(dialog).getByRole("button", { name: "Anular" }));

    await waitFor(() => expect(dialog).not.toHaveAttribute("open"));
    expect(toast.error).toHaveBeenCalled();
    await waitFor(() => expect(vi.mocked(listRecords).mock.calls.length).toBeGreaterThan(callsBefore));
  });

  it("mostra os anulados com o motivo e sem a opção de anular", async () => {
    renderWithQueryClient(<RecordsSection patient={patient} />);
    await screen.findByText("Texto a");

    await userEvent.click(screen.getByRole("button", { name: "Anulados" }));

    const item = await screen.findByRole("listitem");
    expect(listRecords).toHaveBeenLastCalledWith(patientId, { status: "voided", cursor: undefined, limit: 20 });
    expect(screen.getByRole("button", { name: "Anulados" })).toHaveAttribute("aria-pressed", "true");
    expect(item).toHaveTextContent("Texto anulado");
    expect(item).toHaveTextContent("Anulado");
    expect(item).toHaveTextContent("Motivo: Outro motivo");
    expect(item).toHaveTextContent("Lançado no horário errado");
    expect(screen.queryByRole("button", { name: /^Anular registro/ })).not.toBeInTheDocument();
  });

  it("indica quando não há registros anulados", async () => {
    vi.mocked(listRecords).mockResolvedValue({ items: [], nextCursor: null });
    renderWithQueryClient(<RecordsSection patient={patient} />);

    await userEvent.click(screen.getByRole("button", { name: "Anulados" }));

    expect(await screen.findByText(/^Nenhum registro anulado\./)).toBeVisible();
  });

  it("volta para os ativos depois de salvar um registro novo", async () => {
    vi.mocked(createRecord).mockResolvedValue(record("novo"));
    renderWithQueryClient(<RecordsSection patient={patient} />);
    await userEvent.click(screen.getByRole("button", { name: "Anulados" }));
    await screen.findByText("Texto anulado");

    await userEvent.type(textarea(), "Registro novo");
    await userEvent.click(saveButton());

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Ativos" })).toHaveAttribute("aria-pressed", "true"),
    );
  });

  it("não oferece anular registros de paciente arquivado", async () => {
    renderWithQueryClient(
      <RecordsSection patient={{ ...patient, archivedAt: "2026-10-01T12:00:00.000Z" }} />,
    );

    expect(await screen.findByText("Texto a")).toBeVisible();
    expect(screen.queryByRole("button", { name: /^Anular registro/ })).not.toBeInTheDocument();
  });
});
