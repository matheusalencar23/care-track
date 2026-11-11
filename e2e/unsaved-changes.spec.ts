import type { Dialog, Page } from "@playwright/test";
import { expect, fakePatient, fakeRecord, test } from "./fixtures";

const patientId = "0b6f1c2a-1111-4000-8000-000000000001";
const patientPath = `/pacientes/${patientId}`;
const leaveMessage = /Há alterações não salvas nesta página/;

test.use({
  apiOptions: {
    signedIn: true,
    patients: [fakePatient({ id: patientId, name: "José Antônio Pereira" })],
    records: [fakeRecord({ id: "0b6f1c2a-9999-4000-8000-000000000001", patientId, content: "Registro antigo." })],
  },
});

function answerDialogs(page: Page, ...answers: boolean[]) {
  const dialogs: Dialog[] = [];
  page.on("dialog", async (dialog) => {
    dialogs.push(dialog);
    const accept = answers.shift() ?? false;
    await (accept ? dialog.accept() : dialog.dismiss());
  });
  return dialogs;
}

async function openPatientFromList(page: Page) {
  await page.goto("/pacientes");
  await page.getByRole("link", { name: "José Antônio Pereira" }).click();
  await expect(page).toHaveURL(patientPath);
  return page.getByRole("region", { name: "Histórico" });
}

test("sem alterações, navega sem perguntar", async ({ page }) => {
  const dialogs = answerDialogs(page);
  await page.goto(patientPath);
  await page.getByRole("region", { name: "Histórico" }).getByText("Registro antigo.").waitFor();

  await page.getByRole("navigation", { name: "Navegação principal" }).getByRole("link", { name: "Pacientes" }).click();

  await expect(page).toHaveURL("/pacientes");
  expect(dialogs).toEqual([]);
});

test("pergunta antes de seguir um link com texto não salvo", async ({ page, cspViolations }) => {
  const dialogs = answerDialogs(page, false, true);
  await page.goto(patientPath);
  const field = page.getByRole("textbox", { name: "Novo registro" });
  await field.fill("Curativo trocado.");
  const link = page.getByRole("navigation", { name: "Navegação principal" }).getByRole("link", { name: "Pacientes" });

  await link.click();
  await expect.poll(() => dialogs.length).toBe(1);
  expect(dialogs[0].type()).toBe("confirm");
  expect(dialogs[0].message()).toMatch(leaveMessage);
  await expect(page).toHaveURL(patientPath);
  await expect(field).toHaveValue("Curativo trocado.");

  await link.click();
  await expect(page).toHaveURL("/pacientes");
  expect(cspViolations).toEqual([]);
});

test("pergunta antes de voltar pelo histórico do navegador", async ({ page }) => {
  const dialogs = answerDialogs(page, false, true);
  const section = await openPatientFromList(page);
  const field = section.getByRole("textbox", { name: "Novo registro" });
  await field.fill("Curativo trocado.");

  await page.evaluate(() => window.history.back());
  await expect.poll(() => dialogs.length).toBe(1);
  await expect(page).toHaveURL(patientPath);
  await expect(field).toHaveValue("Curativo trocado.");

  await page.evaluate(() => window.history.back());
  await expect(page).toHaveURL("/pacientes");
  await expect(page.getByRole("link", { name: "José Antônio Pereira" })).toBeVisible();
  expect(dialogs).toHaveLength(2);
});

test("pede confirmação do navegador ao fechar a aba", async ({ page }) => {
  await page.goto(patientPath);
  await page.getByRole("textbox", { name: "Novo registro" }).fill("Curativo trocado.");
  const dialog = page.waitForEvent("dialog");

  await page.close({ runBeforeUnload: true });

  const shown = await dialog;
  expect(shown.type()).toBe("beforeunload");
  await shown.dismiss();
});

test("pergunta antes de sair da conta com a edição de um registro alterada", async ({ page }) => {
  const dialogs = answerDialogs(page, false);
  await page.goto(patientPath);
  await page.getByRole("button", { name: /^Editar registro de / }).click();
  await page.getByRole("textbox", { name: "Texto do registro" }).fill("Texto corrigido.");

  await page.getByRole("button", { name: /^Menu do usuário/ }).click();
  await page.getByRole("button", { name: "Sair" }).click();

  await expect.poll(() => dialogs.length).toBe(1);
  await expect(page).toHaveURL(patientPath);
  await expect(page.getByRole("textbox", { name: "Texto do registro" })).toHaveValue("Texto corrigido.");
});

test("pergunta com arquivo enviado e ainda sem registro", async ({ page }) => {
  const dialogs = answerDialogs(page, false);
  await page.goto(patientPath);
  const history = page.getByRole("region", { name: "Histórico" });
  await history.locator('input[type="file"]').setInputFiles({
    name: "laudo.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\n%%EOF"),
  });
  await expect(history.getByRole("list", { name: "Arquivos do novo registro" })).toBeVisible();

  await page.getByRole("navigation", { name: "Navegação principal" }).getByRole("link", { name: "Pacientes" }).click();

  await expect.poll(() => dialogs.length).toBe(1);
  await expect(page).toHaveURL(patientPath);
});

test("pergunta antes de cancelar o cadastro de paciente preenchido", async ({ page }) => {
  const dialogs = answerDialogs(page, false, true);
  await page.goto("/pacientes/novo");
  const name = page.getByRole("textbox", { name: "Nome completo" });
  await name.fill("Ana Souza");

  await page.getByRole("link", { name: "Cancelar" }).click();
  await expect.poll(() => dialogs.length).toBe(1);
  expect(dialogs[0].message()).toMatch(leaveMessage);
  await expect(page).toHaveURL("/pacientes/novo");
  await expect(name).toHaveValue("Ana Souza");

  await page.getByRole("link", { name: "Cancelar" }).click();
  await expect(page).toHaveURL("/pacientes");
});

test("na edição do paciente, só pergunta enquanto os dados estão diferentes dos salvos", async ({ page }) => {
  const dialogs = answerDialogs(page, false);
  await page.goto(`${patientPath}/editar`);
  const name = page.getByRole("textbox", { name: "Nome completo" });
  await expect(name).toHaveValue("José Antônio Pereira");

  await name.fill("José Antônio Pereira Filho");
  await page.getByRole("link", { name: "Cancelar" }).click();
  await expect.poll(() => dialogs.length).toBe(1);
  await expect(page).toHaveURL(`${patientPath}/editar`);

  await name.fill("José Antônio Pereira");
  await page.getByRole("link", { name: "Cancelar" }).click();
  await expect(page).toHaveURL(patientPath);
  expect(dialogs).toHaveLength(1);
});

test("salvar o cadastro leva ao paciente sem perguntar", async ({ page }) => {
  const dialogs = answerDialogs(page);
  await page.goto("/pacientes/novo");
  await page.getByRole("textbox", { name: "Nome completo" }).fill("Ana Souza");
  await page.getByLabel("Data de nascimento").fill("1980-05-10");

  await page.getByRole("button", { name: "Cadastrar paciente" }).click();

  await expect(page).toHaveURL(/\/pacientes\/[0-9a-f-]{36}$/);
  expect(dialogs).toEqual([]);
});
