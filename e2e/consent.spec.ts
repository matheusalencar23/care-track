import { expect, fakePatient, test } from "./fixtures";

const adultId = "0b6f1c2a-1111-4000-8000-000000000001";
const adult = `/pacientes/${adultId}/autorizacoes`;
const minorId = "0b6f1c2a-5555-4000-8000-000000000001";
const minorBirthDate = `${new Date().getFullYear() - 10}-01-15`;

test.use({
  apiOptions: {
    signedIn: true,
    patients: [
      fakePatient({ id: "0b6f1c2a-1111-4000-8000-000000000001", name: "José Antônio Pereira" }),
      fakePatient({ id: minorId, name: "Lia Campos", birthDate: minorBirthDate }),
      fakePatient({
        id: "0b6f1c2a-1111-4000-8000-000000000003",
        name: "Benedita Ramos",
        archivedAt: "2026-10-01T12:00:00.000Z",
      }),
    ],
  },
});

test("registra e revoga uma autorização, mantendo o histórico", async ({ page, api, cspViolations }) => {
  await page.goto(adult);
  const section = page.getByRole("region", { name: "Situação da autorização" });
  await expect(section.getByText("Sem autorização")).toBeVisible();

  const opener = section.getByRole("button", { name: "Registrar autorização" });
  await opener.click();
  const grantDialog = page.getByRole("dialog", { name: "Registrar autorização de uso de imagem" });
  await expect(grantDialog.getByRole("radio", { name: "Por escrito" })).toBeFocused();

  await grantDialog.getByRole("radio", { name: "Por escrito" }).check();
  await grantDialog.getByRole("radio", { name: "O próprio paciente" }).check();
  await grantDialog.getByRole("button", { name: "Registrar" }).click();

  await expect(grantDialog).toBeHidden();
  await expect(page.getByText("Autorização registrada.")).toBeVisible();
  await expect(section.getByText("Autorizado")).toBeVisible();
  await expect(section.getByText("Por escrito")).toBeVisible();
  const revokeButton = section.getByRole("button", { name: "Revogar" });
  await expect(revokeButton).toBeFocused();
  expect(api.grantedConsents).toEqual([{ type: "image_capture", method: "written", grantor: "patient" }]);

  await revokeButton.click();
  const revokeDialog = page.getByRole("dialog", { name: "Revogar autorização?" });
  await revokeDialog.getByLabel("Motivo").fill("Pedido do paciente");
  await revokeDialog.getByRole("button", { name: "Revogar" }).click();

  await expect(revokeDialog).toBeHidden();
  await expect(page.getByText("Autorização revogada.")).toBeVisible();
  await expect(section.getByText("Sem autorização")).toBeVisible();
  await expect(section.getByRole("button", { name: "Registrar autorização" })).toBeFocused();
  await section.getByText("Autorizações revogadas (1)").click();
  await expect(section.getByText("Motivo: Pedido do paciente")).toBeVisible();
  expect(api.revocations).toEqual([{ reason: "Pedido do paciente" }]);
  expect(cspViolations).toEqual([]);
});

test("o detalhe do paciente leva à página de autorização, com a situação no botão", async ({ page, cspViolations }) => {
  await page.goto(`/pacientes/${adultId}`);
  const link = page.getByRole("link", { name: /^Autorização de imagem\s*:\s*Sem autorização$/ });

  await link.click();

  await expect(page).toHaveURL(adult);
  await expect(page.getByRole("heading", { level: 1, name: "Autorização de uso de imagem" })).toBeVisible();
  await expect(page).toHaveTitle("CareTrack");
  await page.getByRole("link", { name: "Voltar ao paciente" }).click();
  await expect(page).toHaveURL(`/pacientes/${adultId}`);
  expect(cspViolations).toEqual([]);
});

test("paciente menor exige o responsável legal", async ({ page, api }) => {
  await page.goto(`/pacientes/${minorId}/autorizacoes`);
  await page.getByRole("button", { name: "Registrar autorização" }).click();
  const dialog = page.getByRole("dialog", { name: "Registrar autorização de uso de imagem" });

  await expect(dialog.getByRole("radio", { name: "O próprio paciente" })).toBeDisabled();
  await expect(dialog.getByRole("radio", { name: "Responsável legal" })).toBeChecked();

  await dialog.getByRole("radio", { name: "Verbal" }).check();
  await dialog.getByLabel("Nome do responsável legal").fill("Rita Campos");
  await dialog.getByRole("button", { name: "Registrar" }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByText("Rita Campos (responsável legal)")).toBeVisible();
  expect(api.grantedConsents).toEqual([
    { type: "image_capture", method: "verbal", grantor: "legal_representative", representativeName: "Rita Campos" },
  ]);
});

test("paciente arquivado não recebe nova autorização", async ({ page }) => {
  await page.goto("/pacientes/0b6f1c2a-1111-4000-8000-000000000003/autorizacoes");

  await expect(page.getByText(/Paciente arquivado não recebe novas autorizações/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Registrar autorização" })).toHaveCount(0);
});

test("o formulário cabe e rola em tela de celular", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto(`/pacientes/${minorId}/autorizacoes`);
  await page.getByRole("button", { name: "Registrar autorização" }).click();
  const dialog = page.getByRole("dialog", { name: "Registrar autorização de uso de imagem" });

  const submit = dialog.getByRole("button", { name: "Registrar" });
  await submit.scrollIntoViewIfNeeded();
  await expect(submit).toBeInViewport();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test.describe("paciente que completou 18 anos", () => {
  const patientId = "0b6f1c2a-5555-4000-8000-000000000002";
  const year = new Date().getFullYear();

  test.use({
    apiOptions: {
      signedIn: true,
      patients: [fakePatient({ id: patientId, name: "Davi Campos", birthDate: `${year - 20}-01-15` })],
      consents: [
        {
          id: "0b6f1c2a-4444-4000-8000-000000000099",
          patientId,
          type: "image_capture",
          method: "written",
          grantor: "legal_representative",
          representativeName: "Rita Campos",
          collectedAt: `${year - 5}-01-15T12:00:00.000Z`,
          status: "active",
          needsRenewal: true,
          revokedAt: null,
          revocationReason: null,
          createdAt: `${year - 5}-01-15T12:00:00.000Z`,
        },
      ],
    },
  });

  test("renova a autorização dada pelo responsável legal", async ({ page, api, cspViolations }) => {
    await page.goto(`/pacientes/${patientId}/autorizacoes`);
    const section = page.getByRole("region", { name: "Situação da autorização" });
    await expect(section.getByText("Renovação necessária")).toBeVisible();

    await section.getByRole("button", { name: "Renovar autorização" }).click();
    const dialog = page.getByRole("dialog", { name: "Renovar autorização de uso de imagem" });
    await dialog.getByRole("radio", { name: "Por escrito" }).check();
    await dialog.getByRole("radio", { name: "O próprio paciente" }).check();
    await dialog.getByRole("button", { name: "Renovar" }).click();

    await expect(dialog).toBeHidden();
    await expect(page.getByText("Autorização renovada.")).toBeVisible();
    await expect(section.getByText("Autorizado")).toBeVisible();
    await expect(section.getByRole("button", { name: "Revogar" })).toBeFocused();
    await expect(section.getByText("Autorizações revogadas (1)")).toBeVisible();
    await section.getByText("Autorizações revogadas (1)").click();
    await expect(section.getByText("Motivo: Renovação: o paciente completou 18 anos.")).toBeVisible();
    expect(api.revocations).toEqual([]);
    expect(api.grantedConsents).toHaveLength(1);
    expect(cspViolations).toEqual([]);
  });

  test("revogar sem renovar não perde o foco", async ({ page }) => {
    await page.goto(`/pacientes/${patientId}/autorizacoes`);
    const section = page.getByRole("region", { name: "Situação da autorização" });

    await section.getByRole("button", { name: "Revogar" }).click();
    await page.getByRole("dialog", { name: "Revogar autorização?" }).getByRole("button", { name: "Revogar" }).click();

    await expect(section.getByText("Sem autorização")).toBeVisible();
    await expect(section.getByRole("button", { name: "Registrar autorização" })).toBeFocused();
  });
});
