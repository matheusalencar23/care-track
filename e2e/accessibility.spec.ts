import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, fakeAttachment, fakeRecord, test } from "./fixtures";

const wcagTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function expectNoViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(wcagTags).analyze();
  const summary = violations.map((violation) => ({
    id: violation.id,
    help: violation.help,
    targets: violation.nodes.map((node) => node.target.join(" ")),
  }));

  expect(summary).toEqual([]);
}

const publicPages = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/verify-email",
  "/reset-password",
  "/termos",
  "/privacidade",
];

for (const path of publicPages) {
  test(`${path} não tem violações de acessibilidade`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("heading").first()).toBeVisible();

    await expectNoViolations(page);
  });
}

test("o login com erros de validação não tem violações", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText(/obrigat|inválid/i).first()).toBeVisible();

  await expectNoViolations(page);
});

test("o cadastro com erros de validação não tem violações", async ({ page }) => {
  await page.goto("/signup");
  await page.getByRole("button", { name: /cadastr|criar/i }).click();
  await expect(page.getByText(/obrigat|inválid/i).first()).toBeVisible();

  await expectNoViolations(page);
});

test.describe("área logada", () => {
  test.use({ apiOptions: { signedIn: true } });

  const josé = "0b6f1c2a-1111-4000-8000-000000000001";

  test("a lista de pacientes não tem violações", async ({ page }) => {
    await page.goto("/pacientes");
    await expect(page.getByText("José Antônio Pereira").first()).toBeVisible();

    await expectNoViolations(page);
  });

  test("a lista vazia não tem violações", async ({ page }) => {
    await page.goto("/pacientes");
    await page.getByRole("searchbox").or(page.getByRole("textbox").first()).fill("ninguém com este nome");
    await expect(page.getByText(/nenhum/i).first()).toBeVisible();

    await expectNoViolations(page);
  });

  test("o cadastro de paciente com erros não tem violações", async ({ page }) => {
    await page.goto("/pacientes/novo");
    await page.getByRole("button", { name: /cadastrar|salvar/i }).click();
    await expect(page.getByText(/obrigat|inválid|informe/i).first()).toBeVisible();

    await expectNoViolations(page);
  });

  test("o detalhe do paciente com registros não tem violações", async ({ page, api }) => {
    api.records = [
      fakeRecord({ id: "0b6f1c2a-2222-4000-8000-000000000001", patientId: josé, content: "Curativo trocado." }),
    ];
    await page.goto(`/pacientes/${josé}`);
    await expect(page.getByText("Curativo trocado.")).toBeVisible();

    await expectNoViolations(page);
  });

  test("o novo registro com arquivos enviados e recusados não tem violações", async ({ page }) => {
    await page.goto(`/pacientes/${josé}`);
    const history = page.getByRole("region", { name: "Histórico" });
    await history.locator('input[type="file"]').setInputFiles([
      { name: "exame.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4") },
      { name: "ferida.png", mimeType: "image/png", buffer: Buffer.from("png") },
      { name: "planilha.xlsx", mimeType: "application/vnd.ms-excel", buffer: Buffer.from("xlsx") },
    ]);
    await expect(history.getByText(/Enviado/)).toBeVisible();
    await expect(history.getByText(/Formato não aceito/)).toBeVisible();

    await expectNoViolations(page);
  });

  test("o visualizador de anexos não tem violações", async ({ page, api }) => {
    const recordId = "0b6f1c2a-2222-4000-8000-000000000002";
    api.consents = [
      {
        id: "0b6f1c2a-4444-4000-8000-000000000001",
        patientId: josé,
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
      },
    ];
    api.records = [
      fakeRecord({
        id: recordId,
        patientId: josé,
        content: null,
        attachments: [
          fakeAttachment({ id: "0b6f1c2a-aaaa-4000-8000-000000000001", patientId: josé, recordId, fileName: "ferida.png" }),
          fakeAttachment({ id: "0b6f1c2a-aaaa-4000-8000-000000000002", patientId: josé, recordId, fileName: "exame.pdf" }),
        ],
      }),
    ];
    await page.goto(`/pacientes/${josé}`);
    await page.getByRole("button", { name: /ferida\.png/ }).click();
    await expect(page.getByRole("img", { name: "Imagem: ferida.png" })).toBeVisible();

    await expectNoViolations(page);
  });

  test("o diálogo de autorização de imagem não tem violações", async ({ page }) => {
    await page.goto(`/pacientes/${josé}`);
    await page.getByRole("button", { name: "Registrar autorização" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await expectNoViolations(page);
  });

  test("a confirmação de arquivamento não tem violações", async ({ page }) => {
    await page.goto(`/pacientes/${josé}`);
    await page.getByRole("button", { name: "Arquivar" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await expectNoViolations(page);
  });

  test("o perfil não tem violações", async ({ page }) => {
    await page.goto("/perfil");
    await expect(page.getByRole("heading").first()).toBeVisible();

    await expectNoViolations(page);
  });
});
