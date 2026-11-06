import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "react-toastify";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Patient } from "@/model/patient";
import { createPatient } from "@/services/patient.service";
import { ApiError } from "@/shared/ApiError";
import { renderWithQueryClient } from "@/test/render";
import NewPatientForm from "./new-patient-form";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/services/patient.service", () => ({
  createPatient: vi.fn(),
}));

vi.mock("react-toastify", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const created: Patient = {
  id: "8f0c6d1e-0000-4000-8000-000000000001",
  name: "Maria das Dores",
  birthDate: "1950-03-15",
  cpf: null,
  cns: null,
  phone: null,
  archivedAt: null,
  createdAt: "2026-11-06T12:00:00.000Z",
  updatedAt: "2026-11-06T12:00:00.000Z",
};

const submit = () => userEvent.click(screen.getByRole("button", { name: "Cadastrar paciente" }));

async function fillRequired() {
  await userEvent.type(screen.getByLabelText("Nome completo"), "  Maria das Dores ");
  await userEvent.type(screen.getByLabelText("Data de nascimento"), "1950-03-15");
}

beforeEach(() => {
  push.mockReset();
  vi.mocked(toast.error).mockReset();
  vi.mocked(toast.success).mockReset();
  vi.mocked(createPatient).mockReset().mockResolvedValue(created);
});

describe("NewPatientForm", () => {
  it("exige nome e data de nascimento", async () => {
    renderWithQueryClient(<NewPatientForm />);

    await submit();

    expect(await screen.findByText("O nome é obrigatório")).toBeVisible();
    expect(screen.getByText("Informe a data de nascimento")).toBeVisible();
    expect(screen.getByLabelText("Nome completo")).toHaveAttribute("aria-invalid", "true");
    expect(createPatient).not.toHaveBeenCalled();
  });

  it("valida os opcionais como a API", async () => {
    renderWithQueryClient(<NewPatientForm />);
    await fillRequired();

    await userEvent.type(screen.getByLabelText("CPF"), "52998224724");
    await userEvent.type(screen.getByLabelText("Cartão SUS"), "898001");
    await userEvent.type(screen.getByLabelText("Telefone"), "119876");
    await submit();

    expect(await screen.findByText("CPF inválido")).toBeVisible();
    expect(screen.getByText("O Cartão SUS deve conter 15 números")).toBeVisible();
    expect(screen.getByText("Informe o telefone com DDD")).toBeVisible();
    expect(createPatient).not.toHaveBeenCalled();
  });

  it("recusa data de nascimento no futuro ou antes de 1900", async () => {
    renderWithQueryClient(<NewPatientForm />);
    await userEvent.type(screen.getByLabelText("Nome completo"), "Maria");
    await userEvent.type(screen.getByLabelText("Data de nascimento"), "2999-01-01");
    await submit();

    expect(await screen.findByText("A data de nascimento não pode estar no futuro")).toBeVisible();

    await userEvent.clear(screen.getByLabelText("Data de nascimento"));
    await userEvent.type(screen.getByLabelText("Data de nascimento"), "1899-12-31");
    await submit();

    expect(await screen.findByText("Data de nascimento inválida")).toBeVisible();
  });

  it("envia só os campos preenchidos, sem máscara, e abre o paciente", async () => {
    const { queryClient } = renderWithQueryClient(<NewPatientForm />);
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    await fillRequired();
    await userEvent.type(screen.getByLabelText("CPF"), "52998224725");

    await submit();

    await waitFor(() => expect(push).toHaveBeenCalledWith(`/pacientes/${created.id}`));
    expect(vi.mocked(createPatient).mock.calls[0][0]).toEqual({
      name: "Maria das Dores",
      birthDate: "1950-03-15",
      cpf: "52998224725",
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["patients"] });
    expect(toast.success).toHaveBeenCalledWith("Paciente cadastrado.");
  });

  it("leva os erros de validação da API para os campos", async () => {
    vi.mocked(createPatient).mockRejectedValue(
      new ApiError("Dados inválidos. Verifique os campos e tente novamente.", {
        statusCode: 422,
        code: "VALIDATION_FAILED",
        errors: [{ location: "body", path: "cns", message: "O Cartão SUS deve conter 15 números" }],
      }),
    );
    renderWithQueryClient(<NewPatientForm />);
    await fillRequired();

    await submit();

    expect(await screen.findByText("O Cartão SUS deve conter 15 números")).toBeVisible();
    expect(screen.getByLabelText("Cartão SUS")).toHaveFocus();
    expect(toast.error).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("mostra no toast o conflito de CPF ou Cartão SUS já cadastrado", async () => {
    vi.mocked(createPatient).mockRejectedValue(
      new ApiError("Este registro já existe.", { statusCode: 409, code: "CONFLICT" }),
    );
    renderWithQueryClient(<NewPatientForm />);
    await fillRequired();

    await submit();

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(push).not.toHaveBeenCalled();
  });
});
