import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "react-toastify";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Consent } from "@/model/consent";
import type { Patient } from "@/model/patient";
import { grantConsent, listConsents, revokeConsent } from "@/services/consent.service";
import { ApiError } from "@/shared/ApiError";
import { renderWithQueryClient } from "@/test/render";
import ConsentSection from "./consent-section";

vi.mock("@/services/consent.service", () => ({
  listConsents: vi.fn(),
  grantConsent: vi.fn(),
  revokeConsent: vi.fn(),
}));

vi.mock("react-toastify", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const patientId = "8f0c6d1e-0000-4000-8000-000000000001";

function patient(overrides: Partial<Patient> = {}): Patient {
  return {
    id: patientId,
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

function consent(overrides: Partial<Consent> = {}): Consent {
  return {
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
    ...overrides,
  };
}

const minorBirthDate = () => `${new Date().getFullYear() - 10}-01-15`;

async function openGrantDialog() {
  await userEvent.click(await screen.findByRole("button", { name: "Registrar autorização" }));
  return screen.getByRole("dialog", { name: "Registrar autorização de uso de imagem" });
}

const submit = (dialog: HTMLElement) =>
  userEvent.click(within(dialog).getByRole("button", { name: "Registrar" }));

beforeEach(() => {
  vi.mocked(toast.error).mockReset();
  vi.mocked(toast.success).mockReset();
  vi.mocked(listConsents).mockReset().mockResolvedValue([]);
  vi.mocked(grantConsent).mockReset().mockResolvedValue(consent());
  vi.mocked(revokeConsent).mockReset();
});

describe("ConsentSection", () => {
  it("mostra que não há autorização", async () => {
    renderWithQueryClient(<ConsentSection patient={patient()} />);

    expect(await screen.findByText("Sem autorização")).toBeVisible();
    expect(screen.getByRole("button", { name: "Registrar autorização" })).toBeVisible();
    expect(listConsents).toHaveBeenCalledWith(patientId);
  });

  it("mostra a autorização ativa e as revogadas", async () => {
    vi.mocked(listConsents).mockResolvedValue([
      consent({ grantor: "legal_representative", representativeName: "Rita Lima", method: "verbal" }),
      consent({
        id: "c0",
        status: "revoked",
        revokedAt: "2026-02-01T12:00:00.000Z",
        revocationReason: "Pedido da família",
      }),
    ]);
    renderWithQueryClient(<ConsentSection patient={patient()} />);

    expect(await screen.findByText("Autorizado")).toBeVisible();
    expect(screen.getByText("Rita Lima (responsável legal)")).toBeVisible();
    expect(screen.getByText("Verbal")).toBeVisible();
    expect(screen.getByText("Autorizações revogadas (1)")).toBeVisible();
    expect(screen.getByText("Motivo: Pedido da família")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Registrar autorização" })).not.toBeInTheDocument();
  });

  it("exige forma e autor da coleta", async () => {
    renderWithQueryClient(<ConsentSection patient={patient()} />);
    const dialog = await openGrantDialog();

    await submit(dialog);

    expect(await within(dialog).findByText("Informe a forma da coleta")).toBeVisible();
    expect(within(dialog).getByText("Informe quem autorizou")).toBeVisible();
    expect(grantConsent).not.toHaveBeenCalled();
  });

  it("registra sem nome de responsável e sem data quando a coleta foi agora", async () => {
    renderWithQueryClient(<ConsentSection patient={patient()} />);
    const dialog = await openGrantDialog();

    await userEvent.click(within(dialog).getByRole("radio", { name: "Por escrito" }));
    await userEvent.click(within(dialog).getByRole("radio", { name: "O próprio paciente" }));
    await submit(dialog);

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Autorização registrada."));
    expect(grantConsent).toHaveBeenCalledWith(patientId, {
      type: "image_capture",
      method: "written",
      grantor: "patient",
    });
  });

  it("exige o nome do responsável legal e envia a data informada", async () => {
    renderWithQueryClient(<ConsentSection patient={patient()} />);
    const dialog = await openGrantDialog();

    await userEvent.click(within(dialog).getByRole("radio", { name: "Verbal" }));
    await userEvent.click(within(dialog).getByRole("radio", { name: "Responsável legal" }));
    await submit(dialog);

    expect(await within(dialog).findByText("O nome do responsável legal é obrigatório")).toBeVisible();

    await userEvent.type(within(dialog).getByLabelText("Nome do responsável legal"), " Rita Lima ");
    const collectedAt = within(dialog).getByLabelText("Data e hora da coleta");
    await userEvent.clear(collectedAt);
    await userEvent.type(collectedAt, "2026-03-01T10:30");
    await submit(dialog);

    await waitFor(() => expect(grantConsent).toHaveBeenCalled());
    expect(grantConsent).toHaveBeenCalledWith(patientId, {
      type: "image_capture",
      method: "verbal",
      grantor: "legal_representative",
      representativeName: "Rita Lima",
      collectedAt: new Date(2026, 2, 1, 10, 30).toISOString(),
    });
  });

  it("recusa data de coleta no futuro", async () => {
    renderWithQueryClient(<ConsentSection patient={patient()} />);
    const dialog = await openGrantDialog();

    await userEvent.click(within(dialog).getByRole("radio", { name: "Verbal" }));
    await userEvent.click(within(dialog).getByRole("radio", { name: "O próprio paciente" }));
    const collectedAt = within(dialog).getByLabelText("Data e hora da coleta");
    await userEvent.clear(collectedAt);
    await userEvent.type(collectedAt, "2999-01-01T10:00");
    await submit(dialog);

    expect(await within(dialog).findByText("A data da coleta não pode estar no futuro")).toBeVisible();
    expect(grantConsent).not.toHaveBeenCalled();
  });

  it("recusa data de coleta anterior ao nascimento", async () => {
    renderWithQueryClient(<ConsentSection patient={patient()} />);
    const dialog = await openGrantDialog();

    await userEvent.click(within(dialog).getByRole("radio", { name: "Verbal" }));
    await userEvent.click(within(dialog).getByRole("radio", { name: "Responsável legal" }));
    await userEvent.type(within(dialog).getByLabelText("Nome do responsável legal"), "Rita Lima");
    const collectedAt = within(dialog).getByLabelText("Data e hora da coleta");
    await userEvent.clear(collectedAt);
    await userEvent.type(collectedAt, "1949-12-31T10:00");
    await submit(dialog);

    expect(
      await within(dialog).findByText(
        "A data da coleta não pode ser anterior ao nascimento do paciente (15/03/1950).",
      ),
    ).toBeVisible();
    expect(grantConsent).not.toHaveBeenCalled();
  });

  it("leva ao campo a recusa da API de coleta anterior ao nascimento", async () => {
    vi.mocked(grantConsent).mockRejectedValue(
      new ApiError("A data da coleta não pode ser anterior ao nascimento.", {
        statusCode: 422,
        code: "CONSENT_COLLECTED_BEFORE_BIRTH",
        errors: [{ location: "body", path: "collectedAt", message: "Data anterior ao nascimento." }],
      }),
    );
    renderWithQueryClient(<ConsentSection patient={patient()} />);
    const dialog = await openGrantDialog();

    await userEvent.click(within(dialog).getByRole("radio", { name: "Verbal" }));
    await userEvent.click(within(dialog).getByRole("radio", { name: "O próprio paciente" }));
    await submit(dialog);

    const collectedAt = within(dialog).getByLabelText("Data e hora da coleta");
    await waitFor(() => expect(collectedAt).toHaveAttribute("aria-invalid", "true"));
    expect(collectedAt).toHaveAccessibleDescription(/anterior ao nascimento do paciente/);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("paciente menor: já seleciona o responsável legal e desativa o próprio paciente", async () => {
    renderWithQueryClient(<ConsentSection patient={patient({ birthDate: minorBirthDate() })} />);
    const dialog = await openGrantDialog();

    expect(within(dialog).getByRole("radio", { name: "O próprio paciente" })).toBeDisabled();
    expect(within(dialog).getByRole("radio", { name: "Responsável legal" })).toBeChecked();
    expect(within(dialog).getByLabelText("Nome do responsável legal")).toBeVisible();
  });

  it("adulto com coleta de quando era menor: exige o responsável legal", async () => {
    const eighteen = new Date().getFullYear() - 20;
    renderWithQueryClient(<ConsentSection patient={patient({ birthDate: `${eighteen}-01-15` })} />);
    const dialog = await openGrantDialog();

    await userEvent.click(within(dialog).getByRole("radio", { name: "Verbal" }));
    await userEvent.click(within(dialog).getByRole("radio", { name: "O próprio paciente" }));
    const collectedAt = within(dialog).getByLabelText("Data e hora da coleta");
    await userEvent.clear(collectedAt);
    await userEvent.type(collectedAt, `${eighteen + 10}-06-01T10:00`);

    expect(within(dialog).getByRole("radio", { name: "O próprio paciente" })).toBeDisabled();

    await submit(dialog);

    expect(await within(dialog).findByRole("radiogroup", { name: "Quem autorizou" })).toHaveAttribute("aria-invalid", "true");
    expect(grantConsent).not.toHaveBeenCalled();
  });

  it("leva a recusa de menor de idade da API para o campo", async () => {
    vi.mocked(grantConsent).mockRejectedValue(
      new ApiError("O paciente é menor de idade.", {
        statusCode: 422,
        code: "CONSENT_REQUIRES_REPRESENTATIVE",
      }),
    );
    renderWithQueryClient(<ConsentSection patient={patient()} />);
    const dialog = await openGrantDialog();

    await userEvent.click(within(dialog).getByRole("radio", { name: "Verbal" }));
    await userEvent.click(within(dialog).getByRole("radio", { name: "O próprio paciente" }));
    await submit(dialog);

    expect(await within(dialog).findByRole("radiogroup", { name: "Quem autorizou" })).toHaveAttribute("aria-invalid", "true");
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("fecha e recarrega quando já existe autorização ativa", async () => {
    vi.mocked(grantConsent).mockRejectedValue(
      new ApiError("Já existe um consentimento ativo.", { statusCode: 409, code: "CONSENT_ALREADY_ACTIVE" }),
    );
    renderWithQueryClient(<ConsentSection patient={patient()} />);
    const dialog = await openGrantDialog();
    await userEvent.click(within(dialog).getByRole("radio", { name: "Verbal" }));
    await userEvent.click(within(dialog).getByRole("radio", { name: "O próprio paciente" }));
    vi.mocked(listConsents).mockResolvedValue([consent()]);

    await submit(dialog);

    expect(await screen.findByText("Autorizado")).toBeVisible();
    expect(toast.error).toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("revoga com motivo opcional", async () => {
    vi.mocked(listConsents).mockResolvedValue([consent()]);
    vi.mocked(revokeConsent).mockResolvedValue(consent({ status: "revoked" }));
    renderWithQueryClient(<ConsentSection patient={patient()} />);

    await userEvent.click(await screen.findByRole("button", { name: "Revogar" }));
    const dialog = screen.getByRole("dialog", { name: "Revogar autorização?" });
    expect(dialog).toHaveTextContent("A revogação é definitiva");
    await userEvent.type(within(dialog).getByLabelText("Motivo"), " Pedido do paciente ");
    vi.mocked(listConsents).mockResolvedValue([consent({ status: "revoked", revokedAt: "2026-11-09T12:00:00.000Z" })]);
    await userEvent.click(within(dialog).getByRole("button", { name: "Revogar" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Autorização revogada."));
    expect(revokeConsent).toHaveBeenCalledWith(patientId, { consentId: "c1", reason: "Pedido do paciente" });
    expect(await screen.findByText("Sem autorização")).toBeVisible();
  });

  describe("paciente que completou 18 anos", () => {
    const birthDate = `${new Date().getFullYear() - 20}-01-15`;
    const collectedAt = `${new Date().getFullYear() - 5}-01-15T12:00:00.000Z`;
    const fromRepresentative = () =>
      consent({ grantor: "legal_representative", representativeName: "Rita Lima", collectedAt, needsRenewal: true });

    async function openRenewal() {
      await userEvent.click(await screen.findByRole("button", { name: "Renovar autorização" }));
      return screen.getByRole("dialog", { name: "Renovar autorização de uso de imagem" });
    }

    it("avisa que é preciso renovar, sem dizer que está autorizado", async () => {
      vi.mocked(listConsents).mockResolvedValue([fromRepresentative()]);
      renderWithQueryClient(<ConsentSection patient={patient({ birthDate })} />);

      expect(await screen.findByText("Renovação necessária")).toBeVisible();
      expect(screen.queryByText("Autorizado")).not.toBeInTheDocument();
      expect(screen.getByText(/não use novas fotos ou vídeos/)).toBeVisible();
      expect(screen.getByRole("button", { name: "Revogar" })).toBeVisible();
    });

    it("renova com uma só requisição, sem revogar antes", async () => {
      vi.mocked(listConsents).mockResolvedValue([fromRepresentative()]);
      renderWithQueryClient(<ConsentSection patient={patient({ birthDate })} />);
      const dialog = await openRenewal();

      await userEvent.click(within(dialog).getByRole("radio", { name: "Por escrito" }));
      await userEvent.click(within(dialog).getByRole("radio", { name: "O próprio paciente" }));
      await userEvent.click(within(dialog).getByRole("button", { name: "Renovar" }));

      await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Autorização renovada."));
      expect(grantConsent).toHaveBeenCalledWith(patientId, {
        type: "image_capture",
        method: "written",
        grantor: "patient",
      });
      expect(revokeConsent).not.toHaveBeenCalled();
    });

    it("usa o needsRenewal da API, sem repetir a regra de idade", async () => {
      vi.mocked(listConsents).mockResolvedValue([{ ...fromRepresentative(), needsRenewal: false }]);
      renderWithQueryClient(<ConsentSection patient={patient({ birthDate })} />);

      expect(await screen.findByText("Autorizado")).toBeVisible();
      expect(screen.queryByText("Renovação necessária")).not.toBeInTheDocument();
    });

    it("não aceita coleta de quando o paciente ainda era menor", async () => {
      vi.mocked(listConsents).mockResolvedValue([fromRepresentative()]);
      renderWithQueryClient(<ConsentSection patient={patient({ birthDate })} />);
      const dialog = await openRenewal();

      await userEvent.click(within(dialog).getByRole("radio", { name: "Verbal" }));
      await userEvent.click(within(dialog).getByRole("radio", { name: "Responsável legal" }));
      await userEvent.type(within(dialog).getByLabelText("Nome do responsável legal"), "Rita Lima");
      const date = within(dialog).getByLabelText("Data e hora da coleta");
      await userEvent.clear(date);
      await userEvent.type(date, `${new Date().getFullYear() - 10}-06-01T10:00`);
      await userEvent.click(within(dialog).getByRole("button", { name: "Renovar" }));

      expect(await within(dialog).findByText(/depois que o paciente completou 18 anos/)).toBeVisible();
      expect(revokeConsent).not.toHaveBeenCalled();
    });

    it("se a renovação falhar, a anterior continua e o formulário fica aberto", async () => {
      vi.mocked(listConsents).mockResolvedValue([fromRepresentative()]);
      vi.mocked(grantConsent).mockRejectedValue(new ApiError("Erro.", { statusCode: 500 }));
      renderWithQueryClient(<ConsentSection patient={patient({ birthDate })} />);
      const dialog = await openRenewal();
      await userEvent.click(within(dialog).getByRole("radio", { name: "Verbal" }));
      await userEvent.click(within(dialog).getByRole("radio", { name: "O próprio paciente" }));

      await userEvent.click(within(dialog).getByRole("button", { name: "Renovar" }));

      await waitFor(() => expect(toast.error).toHaveBeenCalled());
      expect(screen.getByText("Renovação necessária")).toBeVisible();
      expect(screen.getByRole("dialog", { name: "Renovar autorização de uso de imagem" })).toBeVisible();
      expect(revokeConsent).not.toHaveBeenCalled();
    });

    it("arquivado: só permite revogar", async () => {
      vi.mocked(listConsents).mockResolvedValue([fromRepresentative()]);
      renderWithQueryClient(
        <ConsentSection patient={patient({ birthDate, archivedAt: "2026-10-01T12:00:00.000Z" })} />,
      );

      expect(await screen.findByText("Renovação necessária")).toBeVisible();
      expect(screen.getByRole("button", { name: "Revogar" })).toBeVisible();
      expect(screen.queryByRole("button", { name: "Renovar autorização" })).not.toBeInTheDocument();
    });
  });

  it("paciente arquivado: revoga, mas não registra", async () => {
    const archivedAt = "2026-10-01T12:00:00.000Z";
    vi.mocked(listConsents).mockResolvedValueOnce([consent()]);
    const { unmount } = renderWithQueryClient(<ConsentSection patient={patient({ archivedAt })} />);

    expect(await screen.findByRole("button", { name: "Revogar" })).toBeVisible();
    unmount();

    renderWithQueryClient(<ConsentSection patient={patient({ archivedAt })} />);

    expect(await screen.findByText(/Paciente arquivado não recebe novas autorizações/)).toBeVisible();
    expect(screen.queryByRole("button", { name: "Registrar autorização" })).not.toBeInTheDocument();
  });

  it("mostra o erro de carregamento e tenta de novo", async () => {
    vi.mocked(listConsents)
      .mockRejectedValueOnce(new ApiError("Erro.", { statusCode: 500, requestId: "req-789" }))
      .mockResolvedValueOnce([]);
    renderWithQueryClient(<ConsentSection patient={patient()} />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("req-789");

    await userEvent.click(within(alert).getByRole("button", { name: "Tentar novamente" }));

    expect(await screen.findByText("Sem autorização")).toBeVisible();
  });
});
