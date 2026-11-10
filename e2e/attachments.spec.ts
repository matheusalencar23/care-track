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

    await history.getByRole("list", { name: "Anexos" }).getByRole("button", { name: /ferida\.png/ }).click();
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

    await page.getByRole("list", { name: "Anexos" }).getByRole("button", { name: /lesao\.jpg/ }).click();
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

    await page.getByRole("list", { name: "Anexos" }).getByRole("button", { name: /exame\.pdf/ }).click();
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
