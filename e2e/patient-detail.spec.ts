import { expect, test } from "./fixtures";

test.use({ apiOptions: { signedIn: true } });

const josé = "/pacientes/0b6f1c2a-1111-4000-8000-000000000001";

test("mostra os dados cadastrais sem violar a CSP", async ({ page, cspViolations }) => {
  await page.goto(josé);

  await expect(page.getByRole("heading", { level: 1, name: "José Antônio Pereira" })).toBeVisible();
  await expect(page.getByText("***.982.247-**")).toBeVisible();
  await expect(page).toHaveTitle("CareTrack");
  expect(cspViolations).toEqual([]);
});

test("revela o CPF só quando pedido", async ({ page }) => {
  await page.goto(josé);

  await page.getByRole("button", { name: "Mostrar CPF" }).click();

  await expect(page.getByText("529.982.247-25")).toBeVisible();
});

test("indica o paciente arquivado", async ({ page }) => {
  await page.goto("/pacientes/0b6f1c2a-1111-4000-8000-000000000003");

  await expect(page.getByRole("heading", { level: 1, name: "Benedita Ramos" })).toBeVisible();
  await expect(page.getByText("Arquivado", { exact: true })).toBeVisible();
});

for (const id of ["0b6f1c2a-9999-4000-8000-000000000000", "nao-e-um-id"]) {
  test(`mostra paciente não encontrado para ${id}`, async ({ page }) => {
    await page.goto(`/pacientes/${id}`);

    await expect(page.getByRole("heading", { name: "Paciente não encontrado" })).toBeVisible();
    await page.getByRole("link", { name: "Voltar para pacientes" }).click();
    await expect(page).toHaveURL("/pacientes");
  });
}
