import { expect, test } from "./fixtures";

test.use({ apiOptions: { signedIn: true } });

test("cadastra um paciente a partir da lista", async ({ page, api, cspViolations }) => {
  await page.goto("/pacientes");
  await page.getByRole("link", { name: "Novo paciente" }).click();

  await expect(page).toHaveURL("/pacientes/novo");
  await expect(page.getByRole("heading", { name: "Novo paciente" })).toBeVisible();

  await page.getByLabel("Nome completo").fill("Helena Vieira");
  await page.getByLabel("Data de nascimento").fill("1975-04-10");
  await page.getByLabel("CPF").pressSequentially("11144477735");
  await expect(page.getByLabel("CPF")).toHaveValue("111.444.777-35");
  await page.getByLabel("Telefone").pressSequentially("11987654321");
  await page.getByRole("button", { name: "Cadastrar paciente" }).click();

  await expect(page).toHaveURL(/^http:\/\/localhost:3100\/pacientes\/[0-9a-f-]{36}$/);
  await expect(page.getByText("Paciente cadastrado.")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Helena Vieira" })).toBeVisible();
  expect(api.createdPatients).toEqual([
    { name: "Helena Vieira", birthDate: "1975-04-10", cpf: "11144477735", phone: "11987654321" },
  ]);
  expect(cspViolations).toEqual([]);
});

test("avisa quando o CPF já está cadastrado", async ({ page }) => {
  await page.goto("/pacientes/novo");

  await page.getByLabel("Nome completo").fill("Outro José");
  await page.getByLabel("Data de nascimento").fill("1950-03-15");
  await page.getByLabel("CPF").pressSequentially("52998224725");
  await page.getByRole("button", { name: "Cadastrar paciente" }).click();

  await expect(page.getByText("Este registro já existe.")).toBeVisible();
  await expect(page).toHaveURL("/pacientes/novo");
});

test("cancelar volta para a lista sem enviar", async ({ page, api }) => {
  await page.goto("/pacientes/novo");
  await page.getByLabel("Nome completo").fill("Rascunho");
  await page.getByRole("link", { name: "Cancelar" }).click();

  await expect(page).toHaveURL("/pacientes");
  expect(api.createdPatients).toEqual([]);
});
