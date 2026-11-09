import { expect, test } from "./fixtures";

test.use({ apiOptions: { signedIn: true } });

test("arquiva e reativa um paciente", async ({ page, api, cspViolations }) => {
  await page.goto("/pacientes/0b6f1c2a-1111-4000-8000-000000000002");
  await expect(page.getByRole("heading", { level: 1, name: "Maria das Dores" })).toBeVisible();

  await page.getByRole("button", { name: "Arquivar" }).click();
  const archiveDialog = page.getByRole("dialog", { name: "Arquivar paciente?" });
  await expect(archiveDialog.getByRole("button", { name: "Cancelar" })).toBeFocused();
  await archiveDialog.getByRole("button", { name: "Arquivar" }).click();

  await expect(archiveDialog).toBeHidden();
  await expect(page.getByText("Paciente arquivado.")).toBeVisible();
  await expect(page.getByText("Arquivado", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Editar" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Reativar" })).toBeFocused();
  expect(api.count("POST /patients/0b6f1c2a-1111-4000-8000-000000000002/archive")).toBe(1);

  await page.getByRole("link", { name: "Pacientes", exact: true }).first().click();
  await expect(page.getByRole("table").getByRole("link", { name: "Maria das Dores" })).toHaveCount(0);
  await page.getByRole("button", { name: "Arquivados" }).click();
  await page.getByRole("table").getByRole("link", { name: "Maria das Dores" }).click();

  await page.getByRole("button", { name: "Reativar" }).click();
  await page.getByRole("dialog", { name: "Reativar paciente?" }).getByRole("button", { name: "Reativar" }).click();

  await expect(page.getByText("Paciente reativado.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Editar" })).toBeVisible();
  expect(cspViolations).toEqual([]);
});

test("cancelar não arquiva", async ({ page, api }) => {
  await page.goto("/pacientes/0b6f1c2a-1111-4000-8000-000000000001");

  await page.getByRole("button", { name: "Arquivar" }).click();
  await page.keyboard.press("Escape");

  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByRole("button", { name: "Arquivar" })).toBeFocused();
  expect(api.calls.filter((call) => call.endsWith("/archive"))).toEqual([]);
});
