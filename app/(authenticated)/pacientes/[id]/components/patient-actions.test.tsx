import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "react-toastify";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Patient } from "@/model/patient";
import { archivePatient, unarchivePatient } from "@/services/patient.service";
import { ApiError } from "@/shared/ApiError";
import { renderWithQueryClient } from "@/test/render";
import PatientActions from "./patient-actions";

vi.mock("@/services/patient.service", () => ({
  archivePatient: vi.fn(),
  unarchivePatient: vi.fn(),
}));

vi.mock("react-toastify", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const id = "8f0c6d1e-0000-4000-8000-000000000001";
const archivedAt = "2026-11-09T12:00:00.000Z";

function patient(overrides: Partial<Patient> = {}): Patient {
  return {
    id,
    name: "Maria das Dores",
    birthDate: "1950-03-15",
    cpf: null,
    cns: null,
    phone: null,
    archivedAt: null,
    createdAt: "2026-01-01T12:00:00.000Z",
    updatedAt: "2026-01-02T12:00:00.000Z",
    ...overrides,
  };
}

beforeEach(() => {
  vi.mocked(toast.error).mockReset();
  vi.mocked(toast.success).mockReset();
  vi.mocked(archivePatient).mockReset();
  vi.mocked(unarchivePatient).mockReset();
});

describe("PatientActions", () => {
  it("pede confirmação explicando que o prontuário é mantido", async () => {
    renderWithQueryClient(<PatientActions patient={patient()} />);

    await userEvent.click(screen.getByRole("button", { name: "Arquivar" }));

    const dialog = screen.getByRole("dialog", { name: "Arquivar paciente?" });
    expect(dialog).toHaveTextContent("Nada é apagado");
    expect(dialog).toHaveTextContent("Lei 13.787/2018");
    expect(archivePatient).not.toHaveBeenCalled();

    await userEvent.click(within(dialog).getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(archivePatient).not.toHaveBeenCalled();
  });

  it("arquiva, atualiza o cache e fecha a confirmação", async () => {
    vi.mocked(archivePatient).mockResolvedValue(patient({ archivedAt }));
    const { queryClient } = renderWithQueryClient(<PatientActions patient={patient()} />);
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    await userEvent.click(screen.getByRole("button", { name: "Arquivar" }));
    await userEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Arquivar" }),
    );

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(archivePatient).toHaveBeenCalledWith(id);
    expect(queryClient.getQueryData(["patients", "detail", id])).toMatchObject({ archivedAt });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["patients", "list"] });
    expect(toast.success).toHaveBeenCalledWith("Paciente arquivado.");
  });

  it("reativa um paciente arquivado, sem botão de editar", async () => {
    vi.mocked(unarchivePatient).mockResolvedValue(patient());
    renderWithQueryClient(<PatientActions patient={patient({ archivedAt })} />);

    expect(screen.queryByRole("link", { name: "Editar" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Reativar" }));
    const dialog = screen.getByRole("dialog", { name: "Reativar paciente?" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Reativar" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Paciente reativado."));
    expect(unarchivePatient).toHaveBeenCalledWith(id);
  });

  it("mantém a confirmação aberta quando a requisição falha", async () => {
    vi.mocked(archivePatient).mockRejectedValue(new ApiError("Erro.", { statusCode: 500 }));
    renderWithQueryClient(<PatientActions patient={patient()} />);

    await userEvent.click(screen.getByRole("button", { name: "Arquivar" }));
    await userEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Arquivar" }),
    );

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("fecha e recarrega quando o paciente já estava arquivado", async () => {
    vi.mocked(archivePatient).mockRejectedValue(
      new ApiError("Este paciente já está arquivado.", {
        statusCode: 409,
        code: "PATIENT_ALREADY_ARCHIVED",
      }),
    );
    const { queryClient } = renderWithQueryClient(<PatientActions patient={patient()} />);
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    await userEvent.click(screen.getByRole("button", { name: "Arquivar" }));
    await userEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Arquivar" }),
    );

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["patients"] });
    expect(toast.error).toHaveBeenCalled();
  });
});
