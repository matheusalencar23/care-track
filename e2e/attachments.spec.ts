import { expect, fakeAttachment, fakePatient, fakeRecord, test, type FakeConsent } from "./fixtures";

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
    const image = viewer.getByRole("img", { name: "Imagem anexada: ferida.png" });
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
