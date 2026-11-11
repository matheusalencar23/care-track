import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Patient } from "@/model/patient";
import { RECORD_CONTENT_MAX_LENGTH, type PatientRecord } from "@/model/record";
import { queryKeys } from "@/lib/query-keys";
import { hasUnsavedChanges } from "@/lib/unsaved-changes";
import { createRecord, listRecordVersions, listRecords, updateRecord, voidRecord } from "@/services/record.service";
import { ApiError } from "@/shared/ApiError";
import { createTestQueryClient, renderWithQueryClient } from "@/test/render";
import { toast } from "react-toastify";
import RecordsSection from "./records-section";

vi.mock("@/services/record.service", () => ({
  listRecords: vi.fn(),
  createRecord: vi.fn(),
  voidRecord: vi.fn(),
  updateRecord: vi.fn(),
  listRecordVersions: vi.fn(),
}));

vi.mock("@/services/consent.service", () => ({
  listConsents: vi.fn().mockResolvedValue([]),
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
  vi.mocked(updateRecord).mockReset();
  vi.mocked(listRecordVersions).mockReset();
  vi.mocked(toast.info).mockReset();
  vi.mocked(toast.warning).mockReset();
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

    const attachments = await screen.findByRole("list", { name: "Anexos" });
    expect(within(attachments).getByRole("button", { name: /foto\.jpg/ })).toBeVisible();
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

  it("avisa ao sair com texto não salvo e deixa de avisar depois de salvar", async () => {
    vi.mocked(createRecord).mockResolvedValue(record("novo"));
    renderWithQueryClient(<RecordsSection patient={patient} />);
    await screen.findByText("Nenhum registro neste histórico.");
    expect(hasUnsavedChanges()).toBe(false);

    await userEvent.type(textarea(), "   ");
    expect(hasUnsavedChanges()).toBe(false);

    await userEvent.type(textarea(), "Curativo");
    expect(hasUnsavedChanges()).toBe(true);

    await userEvent.click(saveButton());

    await waitFor(() => expect(textarea()).toHaveValue(""));
    expect(hasUnsavedChanges()).toBe(false);
  });

  it("não envia texto vazio nem só com espaços", async () => {
    renderWithQueryClient(<RecordsSection patient={patient} />);

    await userEvent.type(textarea(), "   ");
    await userEvent.click(saveButton());

    expect(await screen.findByText("Escreva o texto do registro ou anexe um arquivo")).toBeVisible();
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
    expect(screen.getByRole("alert")).toHaveTextContent("este registro ainda não foi salvo");
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

describe("RecordsSection: edição", () => {
  function editField() {
    return screen.getByRole("textbox", { name: "Texto do registro" });
  }

  function saveEditButton() {
    return screen.getByRole("button", { name: "Salvar alterações" });
  }

  async function openEditor() {
    await userEvent.click(await screen.findByRole("button", { name: /^Editar registro de / }));
  }

  beforeEach(() => {
    vi.mocked(listRecords).mockResolvedValue({ items: [record("a")], nextCursor: null });
  });

  it("abre no próprio registro com o texto atual e o foco no campo", async () => {
    renderWithQueryClient(<RecordsSection patient={patient} />);

    await openEditor();

    expect(editField()).toHaveValue("Texto a");
    expect(editField()).toHaveFocus();
    expect(screen.getByRole("textbox", { name: "Motivo da edição" })).toHaveValue("");
    expect(screen.getByRole("listitem")).toContainElement(editField());
  });

  it("salva com a versão editada e o motivo, fecha e devolve o foco ao botão", async () => {
    vi.mocked(updateRecord).mockResolvedValue(
      record("a", { content: "Texto corrigido", version: 2, editedAt: "2026-11-09T13:00:00.000Z" }),
    );
    renderWithQueryClient(<RecordsSection patient={patient} />);
    await openEditor();

    await userEvent.clear(editField());
    await userEvent.type(editField(), "  Texto corrigido  ");
    await userEvent.type(screen.getByRole("textbox", { name: "Motivo da edição" }), " Erro de digitação ");
    vi.mocked(listRecords).mockResolvedValue({
      items: [record("a", { content: "Texto corrigido", version: 2, editedAt: "2026-11-09T13:00:00.000Z" })],
      nextCursor: null,
    });
    await userEvent.click(saveEditButton());

    expect(await screen.findByText("Texto corrigido")).toBeVisible();
    expect(updateRecord).toHaveBeenCalledWith(patientId, {
      recordId: "a",
      content: "Texto corrigido",
      version: 1,
      reason: "Erro de digitação",
    });
    expect(toast.success).toHaveBeenCalledWith("Registro atualizado.");
    expect(screen.queryByRole("textbox", { name: "Texto do registro" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Editar registro de / })).toHaveFocus();
    expect(screen.getByRole("listitem")).toHaveTextContent("Editado em");
  });

  it("omite o motivo vazio", async () => {
    vi.mocked(updateRecord).mockResolvedValue(record("a", { content: "Novo", version: 2 }));
    renderWithQueryClient(<RecordsSection patient={patient} />);
    await openEditor();

    await userEvent.clear(editField());
    await userEvent.type(editField(), "Novo");
    await userEvent.click(saveEditButton());

    await waitFor(() =>
      expect(updateRecord).toHaveBeenCalledWith(patientId, { recordId: "a", content: "Novo", version: 1 }),
    );
  });

  it("salvar sem mudar o texto só fecha, sem requisição", async () => {
    renderWithQueryClient(<RecordsSection patient={patient} />);
    await openEditor();

    await userEvent.type(editField(), "   ");
    await userEvent.click(saveEditButton());

    await waitFor(() => expect(screen.queryByRole("textbox", { name: "Texto do registro" })).not.toBeInTheDocument());
    expect(updateRecord).not.toHaveBeenCalled();
  });

  it("não aceita texto vazio", async () => {
    renderWithQueryClient(<RecordsSection patient={patient} />);
    await openEditor();

    await userEvent.clear(editField());
    await userEvent.click(saveEditButton());

    expect(await screen.findByText("Escreva o texto do registro")).toBeVisible();
    expect(updateRecord).not.toHaveBeenCalled();
  });

  it("cancelar descarta o texto e devolve o foco ao botão", async () => {
    renderWithQueryClient(<RecordsSection patient={patient} />);
    await openEditor();

    await userEvent.type(editField(), " mudado");
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.getByText("Texto a")).toBeVisible();
    expect(screen.getByRole("button", { name: /^Editar registro de / })).toHaveFocus();
    expect(updateRecord).not.toHaveBeenCalled();
  });

  it("avisa ao sair com a edição alterada, e não só por abrir o editor", async () => {
    const { unmount } = renderWithQueryClient(<RecordsSection patient={patient} />);
    await openEditor();
    expect(hasUnsavedChanges()).toBe(false);

    await userEvent.type(editField(), " mudado");
    expect(hasUnsavedChanges()).toBe(true);

    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(hasUnsavedChanges()).toBe(false);

    await openEditor();
    await userEvent.type(screen.getByRole("textbox", { name: "Motivo da edição" }), "Correção");
    expect(hasUnsavedChanges()).toBe(true);

    unmount();
    expect(hasUnsavedChanges()).toBe(false);
  });

  it("permite uma edição por vez", async () => {
    vi.mocked(listRecords).mockResolvedValue({ items: [record("b"), record("a")], nextCursor: null });
    renderWithQueryClient(<RecordsSection patient={patient} />);

    await userEvent.click((await screen.findAllByRole("button", { name: /^Editar registro de / }))[0]);

    const [, other] = screen.getAllByRole("listitem");
    expect(within(other).getByRole("button", { name: /^Editar registro de / })).toBeDisabled();
    expect(within(other).getByRole("button", { name: /^Anular registro de / })).toBeDisabled();
  });

  it("mantém o texto digitado e mostra o atual quando o registro mudou em outra aba", async () => {
    vi.mocked(updateRecord)
      .mockRejectedValueOnce(
        new ApiError("Este registro foi alterado depois que você o abriu.", {
          statusCode: 409,
          code: "RECORD_VERSION_OUTDATED",
        }),
      )
      .mockResolvedValueOnce(record("a", { content: "Meu texto", version: 3 }));
    renderWithQueryClient(<RecordsSection patient={patient} />);
    await openEditor();

    await userEvent.clear(editField());
    await userEvent.type(editField(), "Meu texto");
    vi.mocked(listRecords).mockResolvedValue({
      items: [record("a", { content: "Texto da outra aba", version: 2, editedAt: "2026-11-09T13:00:00.000Z" })],
      nextCursor: null,
    });
    await userEvent.click(saveEditButton());

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("alterado em outro lugar");
    expect(alert).toHaveTextContent("Texto da outra aba");
    expect(editField()).toHaveValue("Meu texto");
    expect(toast.error).toHaveBeenCalled();

    await userEvent.click(saveEditButton());

    await waitFor(() =>
      expect(updateRecord).toHaveBeenLastCalledWith(patientId, { recordId: "a", content: "Meu texto", version: 2 }),
    );
  });

  it("fecha e avisa que o texto não foi salvo quando o registro foi anulado em outra aba", async () => {
    vi.mocked(updateRecord).mockRejectedValue(
      new ApiError("Este registro foi anulado e não pode ser alterado.", { statusCode: 409, code: "RECORD_VOIDED" }),
    );
    renderWithQueryClient(<RecordsSection patient={patient} />);
    await openEditor();

    await userEvent.type(editField(), " mudado");
    await userEvent.click(saveEditButton());

    await waitFor(() => expect(screen.queryByRole("textbox", { name: "Texto do registro" })).not.toBeInTheDocument());
    expect(toast.error).toHaveBeenCalled();
    expect(toast.warning).toHaveBeenCalledWith("O texto que você digitou não foi salvo.");
  });

  it("fecha com aviso quando a API diz que o texto não mudou", async () => {
    vi.mocked(updateRecord).mockRejectedValue(
      new ApiError("O conteúdo informado é igual ao da versão atual do registro.", {
        statusCode: 422,
        code: "RECORD_CONTENT_UNCHANGED",
      }),
    );
    renderWithQueryClient(<RecordsSection patient={patient} />);
    await openEditor();

    await userEvent.type(editField(), " mudado");
    await userEvent.click(saveEditButton());

    await waitFor(() => expect(screen.queryByRole("textbox", { name: "Texto do registro" })).not.toBeInTheDocument());
    expect(toast.info).toHaveBeenCalledWith("O conteúdo informado é igual ao da versão atual do registro.");
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("preserva o texto se o paciente for arquivado durante a edição", async () => {
    vi.mocked(updateRecord).mockRejectedValue(
      new ApiError("Paciente arquivado.", { statusCode: 409, code: "PATIENT_ARCHIVED" }),
    );
    const { rerender } = renderWithQueryClient(<RecordsSection patient={patient} />);
    await openEditor();

    await userEvent.type(editField(), " mudado");
    await userEvent.click(saveEditButton());
    await waitFor(() => expect(toast.error).toHaveBeenCalled());

    rerender(<RecordsSection patient={{ ...patient, archivedAt: "2026-11-09T12:00:00.000Z" }} />);

    expect(editField()).toHaveValue("Texto a mudado");
    expect(editField()).toHaveAttribute("readonly");
    expect(saveEditButton()).toBeDisabled();
    expect(screen.getByRole("button", { name: "Fechar sem salvar" })).toBeEnabled();
  });

  it("não oferece editar registros anulados nem de paciente arquivado", async () => {
    const { unmount } = renderWithQueryClient(
      <RecordsSection patient={{ ...patient, archivedAt: "2026-10-01T12:00:00.000Z" }} />,
    );
    expect(await screen.findByText("Texto a")).toBeVisible();
    expect(screen.queryByRole("button", { name: /^Editar registro/ })).not.toBeInTheDocument();
    unmount();

    vi.mocked(listRecords).mockResolvedValue({
      items: [record("x", { voidedAt: "2026-11-09T15:00:00.000Z", voidReason: "duplicate" })],
      nextCursor: null,
    });
    renderWithQueryClient(<RecordsSection patient={patient} />);
    await userEvent.click(screen.getByRole("button", { name: "Anulados" }));

    expect(await screen.findByText("Texto x")).toBeVisible();
    expect(screen.queryByRole("button", { name: /^Editar registro/ })).not.toBeInTheDocument();
  });
});

describe("RecordsSection: versões anteriores", () => {
  const author = { id: "autor-1", name: "Ana Souza", coren: "123456", corenState: "SP" };

  it("só busca as versões quando pedido e lista as anteriores com o motivo", async () => {
    vi.mocked(listRecords).mockResolvedValue({
      items: [record("a", { content: "Texto atual", version: 2, editedAt: "2026-11-09T13:00:00.000Z" })],
      nextCursor: null,
    });
    vi.mocked(listRecordVersions).mockResolvedValue([
      { version: 2, content: "Texto atual", reason: "Erro de digitação", author, createdAt: "2026-11-09T13:00:00.000Z" },
      { version: 1, content: "Texto original", reason: null, author, createdAt: "2026-11-09T12:00:00.000Z" },
    ]);
    renderWithQueryClient(<RecordsSection patient={patient} />);

    const toggle = await screen.findByRole("button", { name: "Ver versões anteriores" });
    expect(listRecordVersions).not.toHaveBeenCalled();
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(toggle);

    expect(await screen.findByText("Texto original")).toBeVisible();
    expect(listRecordVersions).toHaveBeenCalledWith(patientId, "a");
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(toggle).toHaveAccessibleName("Ocultar versões anteriores");
    expect(screen.getByText(/Versão 1/)).toBeVisible();
    expect(screen.queryByText(/Versão 2/)).not.toBeInTheDocument();

    await userEvent.click(toggle);

    expect(screen.queryByText("Texto original")).not.toBeInTheDocument();
  });

  it("não mostra o botão em registro nunca editado", async () => {
    vi.mocked(listRecords).mockResolvedValue({ items: [record("a")], nextCursor: null });
    renderWithQueryClient(<RecordsSection patient={patient} />);

    await screen.findByText("Texto a");

    expect(screen.queryByRole("button", { name: "Ver versões anteriores" })).not.toBeInTheDocument();
    expect(screen.getByRole("listitem")).not.toHaveTextContent("Editado em");
  });
});
