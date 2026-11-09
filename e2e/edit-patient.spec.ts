import { expect, test } from "./fixtures";

test.use({ apiOptions: { signedIn: true } });

const josé = "/pacientes/0b6f1c2a-1111-4000-8000-000000000001";

test("edita os dados a partir do detalhe", async ({ page, api, cspViolations }) => {
  await page.goto(josé);
  await page.getByRole("link", { name: "Editar" }).click();

  await expect(page).toHaveURL(`${josé}/editar`);
  await expect(page.getByLabel("Nome completo")).toHaveValue("José Antônio Pereira");

  await page.getByLabel("Telefone").pressSequentially("1134567890");
  await page.getByLabel("CPF").clear();
  await page.getByRole("button", { name: "Salvar alterações" }).click();

  await expect(page).toHaveURL(josé);
  await expect(page.getByText("Dados do paciente atualizados.")).toBeVisible();
  await expect(page.getByText("(11) 3456-7890")).toBeVisible();
  expect(api.updatedPatients).toEqual([
    { name: "José Antônio Pereira", birthDate: "1950-03-15", phone: "1134567890" },
  ]);
  expect(cspViolations).toEqual([]);
});

test("cancelar volta para o paciente sem salvar", async ({ page, api }) => {
  await page.goto(`${josé}/editar`);
  await page.getByLabel("Nome completo").fill("Outro nome");
  await page.getByRole("link", { name: "Cancelar" }).click();

  await expect(page).toHaveURL(josé);
  await expect(page.getByRole("heading", { level: 1, name: "José Antônio Pereira" })).toBeVisible();
  expect(api.updatedPatients).toEqual([]);
});

test("não permite editar paciente arquivado", async ({ page }) => {
  await page.goto("/pacientes/0b6f1c2a-1111-4000-8000-000000000003/editar");

  await expect(page.getByRole("heading", { name: "Paciente arquivado" })).toBeVisible();
  await expect(page.getByLabel("Nome completo")).toHaveCount(0);
});
