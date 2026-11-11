import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "react-toastify";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Patient } from "@/model/patient";
import { getPatient, updatePatient } from "@/services/patient.service";
import { ApiError } from "@/shared/ApiError";
import { renderWithQueryClient } from "@/test/render";
import EditPatient from "./edit-patient";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/services/patient.service", () => ({
  getPatient: vi.fn(),
  updatePatient: vi.fn(),
}));

vi.mock("react-toastify", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const id = "8f0c6d1e-0000-4000-8000-000000000001";

function patient(overrides: Partial<Patient> = {}): Patient {
  return {
    id,
    name: "Maria das Dores",
    birthDate: "1950-03-15",
    cpf: "52998224725",
    cns: null,
    phone: "11987654321",
    archivedAt: null,
    createdAt: "2026-01-01T12:00:00.000Z",
    updatedAt: "2026-01-02T12:00:00.000Z",
    ...overrides,
  };
}

const save = () => userEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));

beforeEach(() => {
  push.mockReset();
  vi.mocked(toast.error).mockReset();
  vi.mocked(toast.success).mockReset();
  vi.mocked(getPatient).mockReset().mockResolvedValue(patient());
  vi.mocked(updatePatient).mockReset();
});

describe("EditPatient", () => {
  it("preenche o formulário com os dados atuais", async () => {
    renderWithQueryClient(<EditPatient id={id} />);

    expect(await screen.findByLabelText("Nome completo")).toHaveValue("Maria das Dores");
    expect(screen.getByLabelText("Data de nascimento")).toHaveValue("1950-03-15");
    expect(screen.getByLabelText("CPF")).toHaveValue("529.982.247-25");
    expect(screen.getByLabelText("Cartão SUS")).toHaveValue("");
    expect(screen.getByLabelText("Telefone")).toHaveValue("(11) 98765-4321");
    expect(screen.getByRole("link", { name: "Cancelar" })).toHaveAttribute("href", `/pacientes/${id}`);
  });

  it("envia o corpo completo, sem o opcional apagado, e volta para o paciente", async () => {
    const updated = patient({ name: "Maria das Dores Silva", phone: null });
    vi.mocked(updatePatient).mockResolvedValue(updated);
    const { queryClient } = renderWithQueryClient(<EditPatient id={id} />);
    const name = await screen.findByLabelText("Nome completo");

    await userEvent.type(name, " Silva");
    await userEvent.clear(screen.getByLabelText("Telefone"));
    await save();

    await waitFor(() => expect(push).toHaveBeenCalledWith(`/pacientes/${id}`));
    expect(updatePatient).toHaveBeenCalledWith(id, {
      name: "Maria das Dores Silva",
      birthDate: "1950-03-15",
      cpf: "52998224725",
    });
    expect(queryClient.getQueryData(["patients", "detail", id])).toEqual(updated);
    expect(toast.success).toHaveBeenCalledWith("Dados do paciente atualizados.");
  });

  it("não chama a API quando nada mudou", async () => {
    renderWithQueryClient(<EditPatient id={id} />);
    await screen.findByLabelText("Nome completo");

    await save();

    await waitFor(() => expect(push).toHaveBeenCalledWith(`/pacientes/${id}`));
    expect(updatePatient).not.toHaveBeenCalled();
  });

  it("não mostra o formulário de um paciente arquivado", async () => {
    vi.mocked(getPatient).mockResolvedValue(patient({ archivedAt: "2026-10-01T12:00:00.000Z" }));
    renderWithQueryClient(<EditPatient id={id} />);

    expect(await screen.findByRole("heading", { name: "Paciente arquivado" })).toBeVisible();
    expect(screen.queryByLabelText("Nome completo")).not.toBeInTheDocument();
  });

  it("recarrega o paciente quando a API diz que ele foi arquivado", async () => {
    vi.mocked(updatePatient).mockRejectedValue(
      new ApiError("Este paciente está arquivado.", { statusCode: 409, code: "PATIENT_ARCHIVED" }),
    );
    renderWithQueryClient(<EditPatient id={id} />);
    await userEvent.type(await screen.findByLabelText("Nome completo"), " Silva");
    vi.mocked(getPatient).mockResolvedValue(patient({ archivedAt: "2026-10-01T12:00:00.000Z" }));

    await save();

    expect(await screen.findByRole("heading", { name: "Paciente arquivado" })).toBeVisible();
    expect(toast.error).toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("mostra no campo a recusa de nascimento posterior a uma autorização", async () => {
    vi.mocked(updatePatient).mockRejectedValue(
      new ApiError("A data de nascimento é posterior a um consentimento.", {
        statusCode: 422,
        code: "PATIENT_BIRTH_DATE_AFTER_CONSENT",
        errors: [{ location: "body", path: "birthDate", message: "Data posterior a um consentimento." }],
      }),
    );
    renderWithQueryClient(<EditPatient id={id} />);
    const birthDate = await screen.findByLabelText("Data de nascimento");
    await userEvent.clear(birthDate);
    await userEvent.type(birthDate, "2020-01-01");

    await save();

    await waitFor(() => expect(birthDate).toHaveAttribute("aria-invalid", "true"));
    expect(birthDate).toHaveAccessibleDescription(/autorização de uso de imagem coletada antes desta data/);
    expect(birthDate).toHaveFocus();
    expect(toast.error).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("mostra paciente não encontrado", async () => {
    vi.mocked(getPatient).mockRejectedValue(
      new ApiError("Paciente não encontrado!", { statusCode: 404, code: "PATIENT_NOT_FOUND" }),
    );
    renderWithQueryClient(<EditPatient id={id} />);

    expect(await screen.findByRole("heading", { name: "Paciente não encontrado" })).toBeVisible();
  });
});
