import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Paginated, Patient } from "@/model/patient";
import { listPatients } from "@/services/patient.service";
import { ApiError } from "@/shared/ApiError";
import { renderWithQueryClient } from "@/test/render";
import PatientList from "./patient-list";

vi.mock("@/services/patient.service", () => ({
  listPatients: vi.fn(),
}));

function patient(overrides: Partial<Patient> = {}): Patient {
  return {
    id: "8f0c6d1e-0000-4000-8000-000000000001",
    name: "Maria das Dores",
    birthDate: "1950-03-15",
    cpf: "52998224725",
    cns: null,
    phone: null,
    archivedAt: null,
    createdAt: "2026-01-01T12:00:00.000Z",
    updatedAt: "2026-01-01T12:00:00.000Z",
    ...overrides,
  };
}

function pageOf(items: Patient[], overrides: Partial<Paginated<Patient>> = {}): Paginated<Patient> {
  return { items, page: 1, limit: 20, total: items.length, totalPages: items.length ? 1 : 0, ...overrides };
}

beforeEach(() => {
  vi.mocked(listPatients).mockReset();
});

describe("PatientList", () => {
  it("lista os pacientes ativos com o CPF mascarado", async () => {
    vi.mocked(listPatients).mockResolvedValue(
      pageOf([patient(), patient({ id: "2", name: "João Lima", cpf: null, birthDate: "1980-07-01" })]),
    );

    renderWithQueryClient(<PatientList />);

    const table = await screen.findByRole("table", { name: "Pacientes ativos" });

    expect(within(table).getByRole("link", { name: "Maria das Dores" })).toHaveAttribute(
      "href",
      "/pacientes/8f0c6d1e-0000-4000-8000-000000000001",
    );
    expect(within(table).getByText("***.982.247-**")).toBeVisible();
    expect(within(table).getByText("Não informado")).toBeVisible();
    expect(within(table).getByText("15/03/1950")).toBeVisible();
    expect(screen.queryByText(/52998224725|529\.982\.247-25/)).not.toBeInTheDocument();
    expect(listPatients).toHaveBeenCalledWith({ search: "", status: "active", page: 1, limit: 20 });
  });

  it("busca no servidor depois que a digitação para, sem a máscara do CPF", async () => {
    vi.mocked(listPatients).mockResolvedValue(pageOf([patient()]));
    renderWithQueryClient(<PatientList />);
    await screen.findByRole("table");

    await userEvent.type(screen.getByLabelText("Buscar paciente"), "529.982.247-25");

    await waitFor(() =>
      expect(listPatients).toHaveBeenLastCalledWith({
        search: "52998224725",
        status: "active",
        page: 1,
        limit: 20,
      }),
    );
    expect(listPatients).toHaveBeenCalledTimes(2);
  });

  it("mostra os arquivados ao trocar o filtro", async () => {
    vi.mocked(listPatients).mockImplementation(async ({ status }) =>
      status === "archived" ? pageOf([]) : pageOf([patient()]),
    );
    renderWithQueryClient(<PatientList />);
    await screen.findByRole("table");

    await userEvent.click(screen.getByRole("button", { name: "Arquivados" }));

    expect(await screen.findByRole("heading", { name: "Nenhum paciente arquivado" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Arquivados" })).toHaveAttribute("aria-pressed", "true");
  });

  it("convida a cadastrar quando ainda não há pacientes", async () => {
    vi.mocked(listPatients).mockResolvedValue(pageOf([]));
    renderWithQueryClient(<PatientList />);

    expect(await screen.findByRole("heading", { name: "Nenhum paciente cadastrado" })).toBeVisible();
    expect(screen.getAllByRole("link", { name: "Novo paciente" })[1]).toHaveAttribute(
      "href",
      "/pacientes/novo",
    );
  });

  it("diz quando a busca não encontra ninguém", async () => {
    vi.mocked(listPatients).mockImplementation(async ({ search }) =>
      search ? pageOf([]) : pageOf([patient()]),
    );
    renderWithQueryClient(<PatientList />);
    await screen.findByRole("table");

    await userEvent.type(screen.getByLabelText("Buscar paciente"), "zzz");

    expect(await screen.findByRole("heading", { name: "Nenhum paciente encontrado" })).toBeVisible();
  });

  it("pagina e volta para a primeira página ao mudar a busca", async () => {
    vi.mocked(listPatients).mockImplementation(async ({ page }) =>
      pageOf([patient({ name: `Paciente da página ${page}` })], { page, total: 45, totalPages: 3 }),
    );
    renderWithQueryClient(<PatientList />);
    await screen.findByText("Paciente da página 1");

    await userEvent.click(screen.getByRole("button", { name: "Página 2" }));

    expect(await screen.findByText("Paciente da página 2")).toBeVisible();
    expect(screen.getByRole("button", { name: "Página 2" })).toHaveAttribute("aria-current", "page");

    await userEvent.type(screen.getByLabelText("Buscar paciente"), "Maria");

    await waitFor(() =>
      expect(listPatients).toHaveBeenLastCalledWith({ search: "Maria", status: "active", page: 1, limit: 20 }),
    );
  });

  it("mostra o erro com o código da requisição e tenta de novo", async () => {
    vi.mocked(listPatients).mockRejectedValueOnce(
      new ApiError("Ocorreu um erro inesperado.", { statusCode: 500, requestId: "req-123" }),
    );
    vi.mocked(listPatients).mockResolvedValueOnce(pageOf([patient()]));
    renderWithQueryClient(<PatientList />);

    const alert = await screen.findByRole("alert");

    expect(alert).toHaveTextContent("Não foi possível carregar os pacientes.");
    expect(alert).toHaveTextContent("req-123");

    await userEvent.click(within(alert).getByRole("button", { name: "Tentar novamente" }));

    expect(await screen.findByRole("table")).toBeVisible();
  });
});
