import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Patient } from "@/model/patient";
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
