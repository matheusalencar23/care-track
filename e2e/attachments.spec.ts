import { expect, fakeAttachment, fakePatient, fakeRecord, test, tinyPdf, type FakeConsent } from "./fixtures";

const patientId = "0b6f1c2a-1111-4000-8000-000000000001";
const patientPath = `/pacientes/${patientId}`;

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

const activeConsent: FakeConsent = {
  id: "0b6f1c2a-4444-4000-8000-000000000099",
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
};

const patients = [fakePatient({ id: patientId, name: "José Antônio Pereira" })];

test.describe("com autorização de uso de imagem", () => {
  test.use({ apiOptions: { signedIn: true, patients, consents: [activeConsent] } });

  test("envia uma foto, salva o registro e abre a imagem pela URL assinada", async ({ page, api, cspViolations }) => {
    await page.goto(patientPath);
    const history = page.getByRole("region", { name: "Histórico" });

    await history.locator('input[type="file"]').setInputFiles({ name: "ferida.png", mimeType: "image/png", buffer: png });
    const uploads = history.getByRole("list", { name: "Arquivos do novo registro" });
    await expect(uploads.getByText(/Enviado/)).toBeVisible();

    await history.getByRole("button", { name: "Salvar registro" }).click();

    await expect(page.getByText("Registro salvo.")).toBeVisible();
    await expect(uploads).toBeHidden();
    expect(api.createdRecords).toEqual([{ attachmentIds: [api.attachments[0]?.id] }]);
    expect(api.count("GET /patients/" + patientId + "/attachments/" + api.attachments[0]?.id + "/download")).toBe(0);

    await history.getByRole("list", { name: "Anexos", exact: true }).getByRole("button", { name: /ferida\.png/ }).click();
    const viewer = page.getByRole("dialog", { name: "Anexo" });
    const image = viewer.getByRole("img", { name: "Imagem: ferida.png" });
    await expect(image).toBeVisible();
    await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(0);

    await page.keyboard.press("Escape");
    await expect(viewer).toBeHidden();
    await expect(history.getByRole("button", { name: /ferida\.png/ })).toBeFocused();
    expect(cspViolations).toEqual([]);
  });
});

test.describe("sem autorização de uso de imagem", () => {
  test.use({
    apiOptions: {
      signedIn: true,
      patients,
      records: [
        fakeRecord({
          id: "0b6f1c2a-6666-4000-8000-000000000101",
          patientId,
          content: "Foto da lesão.",
          attachments: [
            fakeAttachment({
              id: "0b6f1c2a-aaaa-4000-8000-000000000101",
              patientId,
              recordId: "0b6f1c2a-6666-4000-8000-000000000101",
              fileName: "lesao.jpg",
            }),
          ],
        }),
      ],
    },
  });

  test("bloqueia fotos antes do envio e aceita PDF", async ({ page, api, cspViolations }) => {
    await page.goto(patientPath);
    const history = page.getByRole("region", { name: "Histórico" });
    await expect(history.getByText(/Fotos e vídeos exigem uma autorização de uso de imagem ativa\./)).toBeVisible();

    await history.locator('input[type="file"]').setInputFiles([
      { name: "ferida.png", mimeType: "image/png", buffer: png },
      { name: "exame.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4") },
    ]);
    const uploads = history.getByRole("list", { name: "Arquivos do novo registro" });

    await expect(uploads.getByText(/Registre a autorização e envie de novo/)).toBeVisible();
    await expect(uploads.getByText(/· Enviado$/)).toBeVisible();
    expect(api.count(`POST /patients/${patientId}/attachments`)).toBe(1);

    await uploads.getByRole("button", { name: "Remover ferida.png" }).click();
    await history.getByRole("button", { name: "Salvar registro" }).click();

    await expect(page.getByText("Registro salvo.")).toBeVisible();
    expect(api.createdRecords).toEqual([{ attachmentIds: [api.attachments[0]?.id] }]);
    expect(cspViolations).toEqual([]);
  });

  test("explica no visualizador que a foto depende de autorização", async ({ page, api }) => {
    await page.goto(patientPath);

    await page.getByRole("list", { name: "Anexos", exact: true }).getByRole("button", { name: /lesao\.jpg/ }).click();
    const viewer = page.getByRole("dialog", { name: "Anexo" });

    await expect(viewer.getByText(/depende de uma autorização de uso de imagem ativa/)).toBeVisible();
    expect(api.calls.some((call) => call.includes("/download"))).toBe(false);
  });
});

test.describe("pré-visualização de PDF", () => {
  const recordId = "0b6f1c2a-6666-4000-8000-000000000201";
  const pdfId = "0b6f1c2a-aaaa-4000-8000-000000000201";

  test.use({
    apiOptions: {
      signedIn: true,
      patients,
      records: [
        fakeRecord({
          id: recordId,
          patientId,
          content: "Resultado do exame.",
          attachments: [fakeAttachment({ id: pdfId, patientId, recordId, fileName: "exame.pdf" })],
        }),
      ],
    },
  });

  test("mostra o PDF escolhido antes de salvar, sem enviar nada para exibir", async ({ page, api, cspViolations }) => {
    await page.goto(patientPath);
    const history = page.getByRole("region", { name: "Histórico" });

    await history.locator('input[type="file"]').setInputFiles({ name: "laudo.pdf", mimeType: "application/pdf", buffer: tinyPdf });
    await history.getByRole("button", { name: "Visualizar laudo.pdf" }).click();

    const preview = page.getByRole("dialog", { name: "Pré-visualização" });
    const frame = preview.getByTitle("Documento: laudo.pdf");
    await expect(frame).toHaveAttribute("src", /^blob:/);
    expect(api.calls.filter((call) => call.includes("/download"))).toEqual([]);

    await page.keyboard.press("Escape");
    await expect(history.getByRole("button", { name: "Visualizar laudo.pdf" })).toBeFocused();
    expect(cspViolations).toEqual([]);
  });

  test("mostra o PDF salvo pela URL de exibição e baixa por outra", async ({ page, api, cspViolations }) => {
    await page.goto(patientPath);

    await page.getByRole("list", { name: "Anexos", exact: true }).getByRole("button", { name: /exame\.pdf/ }).click();
    const viewer = page.getByRole("dialog", { name: "Anexo" });

    await expect(viewer.getByTitle("Documento: exame.pdf")).toHaveAttribute(
      "src",
      `https://storage.e2e.test/${pdfId}?disposition=inline`,
    );
    await expect.poll(() => api.calls.includes(`STORAGE /${pdfId}?disposition=inline`)).toBe(true);

    const downloadRequest = page.waitForRequest(`https://storage.e2e.test/${pdfId}?disposition=attachment`);
    await viewer.getByRole("button", { name: "Baixar arquivo" }).click();
    await downloadRequest;

    expect(api.count(`GET /patients/${patientId}/attachments/${pdfId}/download`)).toBe(2);
    expect(cspViolations).toEqual([]);
  });
});

test.describe("carrossel de anexos", () => {
  const recordId = "0b6f1c2a-6666-4000-8000-000000000301";

  test.use({
    apiOptions: {
      signedIn: true,
      patients,
      consents: [activeConsent],
      records: [
        fakeRecord({
          id: recordId,
          patientId,
          content: "Curativo.",
          attachments: [
            fakeAttachment({
              id: "0b6f1c2a-aaaa-4000-8000-000000000301",
              patientId,
              recordId,
              fileName: "ferida.png",
              createdAt: "2026-11-02T12:00:00.000Z",
            }),
            fakeAttachment({
              id: "0b6f1c2a-aaaa-4000-8000-000000000302",
              patientId,
              recordId,
              fileName: "exame.pdf",
              createdAt: "2026-11-01T12:00:00.000Z",
            }),
          ],
        }),
      ],
    },
  });

  test("lista os anexos do paciente entre os dados e o histórico e abre o visualizador", async ({ page, api, cspViolations }) => {
    await page.goto(patientPath);
    const carousel = page.getByRole("region", { name: "Anexos", exact: true });

    await expect(carousel).toContainText("2 anexos");
    expect(api.calls.filter((call) => call.includes("/download") || call.startsWith("STORAGE"))).toEqual([]);

    await carousel.getByRole("button", { name: "Ver anexos" }).click();
    const viewer = page.getByRole("dialog", { name: /^Anexo \d de 2$/ });
    await expect(viewer).toHaveAccessibleName("Anexo 1 de 2");
    await expect(viewer.getByRole("img", { name: "Imagem: ferida.png" })).toBeVisible();
    await viewer.getByRole("button", { name: "Próximo" }).click();
    await expect(viewer).toHaveAccessibleName("Anexo 2 de 2");
    await expect(viewer.getByTitle("Documento: exame.pdf")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(viewer).toBeHidden();
    await expect(carousel.getByRole("button", { name: "Ver anexos" })).toBeFocused();

    const order = await page.getByRole("heading", { level: 2 }).allTextContents();
    expect(order.slice(0, 3)).toEqual(["Dados cadastrais", "Anexos", "Histórico"]);
    expect(cspViolations).toEqual([]);
  });
});

test.describe("muitos anexos", () => {
  const recordId = "0b6f1c2a-6666-4000-8000-000000000501";

  test.use({
    apiOptions: {
      signedIn: true,
      patients,
      records: [
        fakeRecord({
          id: recordId,
          patientId,
          attachments: Array.from({ length: 25 }, (_, index) =>
            fakeAttachment({
              id: `0b6f1c2a-aaaa-4000-8000-${String(500 + index).padStart(12, "0")}`,
              patientId,
              recordId,
              fileName: `exame-${index}.pdf`,
              createdAt: new Date(Date.UTC(2026, 10, 1, 12, 59 - index)).toISOString(),
            }),
          ),
        }),
      ],
    },
  });

  test("carrega a página seguinte no carrossel e não alarga a página no celular", async ({ page, api }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto(patientPath);
    const carousel = page.getByRole("region", { name: "Anexos", exact: true });
    await expect(carousel).toContainText("Mais de 20 anexos");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);

    await carousel.getByRole("button", { name: "Ver anexos" }).click();
    const viewer = page.getByRole("dialog", { name: /^Anexo \d+ de/ });
    await expect(viewer).toHaveAccessibleName("Anexo 1 de 20+");

    for (let step = 0; step < 19; step++) {
      await viewer.getByRole("button", { name: "Próximo" }).click();
    }

    await expect(viewer).toHaveAccessibleName("Anexo 20 de 25");
    expect(api.count(`GET /patients/${patientId}/attachments`)).toBe(2);
  });
});

test.describe("sem anexos", () => {
  test.use({ apiOptions: { signedIn: true, patients } });

  test("não mostra o carrossel", async ({ page, api }) => {
    await page.goto(patientPath);
    await expect(page.getByRole("region", { name: "Histórico" })).toBeVisible();
    await expect.poll(() => api.count(`GET /patients/${patientId}/attachments`)).toBe(1);

    await expect(page.getByRole("region", { name: "Anexos", exact: true })).toHaveCount(0);
  });
});
