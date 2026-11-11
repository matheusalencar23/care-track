import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Patient } from "@/model/patient";
import { listConsents } from "@/services/consent.service";
import { getPatient } from "@/services/patient.service";
import { ApiError } from "@/shared/ApiError";
import { renderWithQueryClient } from "@/test/render";
import PatientConsents from "./patient-consents";

vi.mock("@/services/patient.service", () => ({
  getPatient: vi.fn(),
}));

vi.mock("@/services/consent.service", () => ({
  listConsents: vi.fn(),
}));

const id = "8f0c6d1e-0000-4000-8000-000000000001";

const patient: Patient = {
  id,
  name: "Maria das Dores",
  birthDate: "1950-03-15",
  cpf: null,
  cns: null,
  phone: null,
  archivedAt: null,
  createdAt: "2026-01-01T12:00:00.000Z",
  updatedAt: "2026-01-01T12:00:00.000Z",
};

beforeEach(() => {
  vi.mocked(getPatient).mockReset();
  vi.mocked(listConsents).mockReset().mockResolvedValue([]);
});

describe("PatientConsents", () => {
  it("mostra a situação da autorização do paciente, com o caminho de volta", async () => {
    vi.mocked(getPatient).mockResolvedValue(patient);
    renderWithQueryClient(<PatientConsents id={id} />);

    expect(screen.getByRole("heading", { level: 1, name: "Autorização de uso de imagem" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Voltar ao paciente" })).toHaveAttribute("href", `/pacientes/${id}`);
    expect(await screen.findByText(/^Paciente:/)).toHaveTextContent("Paciente: Maria das Dores");
    expect(await screen.findByRole("region", { name: "Situação da autorização" })).toBeVisible();
    expect(await screen.findByRole("button", { name: "Registrar autorização" })).toBeVisible();
  });

  it("explica quando o paciente não existe", async () => {
    vi.mocked(getPatient).mockRejectedValue(
      new ApiError("Paciente não encontrado!", { statusCode: 404, code: "PATIENT_NOT_FOUND" }),
    );
    renderWithQueryClient(<PatientConsents id={id} />);

    expect(await screen.findByRole("heading", { name: "Paciente não encontrado" })).toBeVisible();
    expect(listConsents).not.toHaveBeenCalled();
  });
});
