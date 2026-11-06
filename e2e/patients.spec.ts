import { expect, fakePatient, test } from "./fixtures";

test.describe("lista de pacientes", () => {
  test.use({ apiOptions: { signedIn: true } });

  test("lista os ativos com o CPF mascarado e sem violar a CSP", async ({ page, cspViolations }) => {
    await page.goto("/pacientes");

    const table = page.getByRole("table", { name: "Pacientes ativos" });

    await expect(table.getByRole("link", { name: "José Antônio Pereira" })).toHaveAttribute(
      "href",
      "/pacientes/0b6f1c2a-1111-4000-8000-000000000001",
    );
    await expect(table.getByText("***.982.247-**")).toBeVisible();
    await expect(page.getByText("529.982.247-25")).toHaveCount(0);
    await expect(table.getByText("Benedita Ramos")).toHaveCount(0);
    expect(cspViolations).toEqual([]);
  });

  test("abre o paciente ao clicar em qualquer parte da linha", async ({ page }) => {
    await page.goto("/pacientes");

    const cpfCell = page.getByRole("cell", { name: "***.982.247-**" });
    await expect(cpfCell).toBeVisible();
    const box = await cpfCell.boundingBox();
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);

    await expect(page).toHaveURL("/pacientes/0b6f1c2a-1111-4000-8000-000000000001");
  });

  test("busca sem acento e por CPF sem levar o termo para a URL", async ({ page, api }) => {
    await page.goto("/pacientes");
    const search = page.getByLabel("Buscar paciente");
    const table = page.getByRole("table");

    await search.fill("jose antonio");
    await expect(table.getByRole("link")).toHaveText(["José Antônio Pereira"]);

    await search.fill("529.982.247-25");
    await expect.poll(() => api.patientQueries.at(-1)?.get("search")).toBe("52998224725");
    await expect(table.getByRole("link")).toHaveText(["José Antônio Pereira"]);

    await search.fill("ninguém");
    await expect(page.getByRole("heading", { name: "Nenhum paciente encontrado" })).toBeVisible();

    expect(page.url()).toBe("http://localhost:3100/pacientes");
  });

  test("mostra os arquivados pelo filtro", async ({ page }) => {
    await page.goto("/pacientes");
    await page.getByRole("button", { name: "Arquivados" }).click();

    const table = page.getByRole("table", { name: "Pacientes arquivados" });

    await expect(table.getByRole("link")).toHaveText(["Benedita Ramos"]);
    await expect(table.getByText("Arquivado", { exact: true })).toBeVisible();
  });
});

test.describe("lista vazia", () => {
  test.use({ apiOptions: { signedIn: true, patients: [] } });

  test("convida a cadastrar o primeiro paciente", async ({ page }) => {
    await page.goto("/pacientes");

    await expect(page.getByRole("heading", { name: "Nenhum paciente cadastrado" })).toBeVisible();
  });
});

test.describe("lista com várias páginas", () => {
  test.use({
    apiOptions: {
      signedIn: true,
      patients: Array.from({ length: 45 }, (_, index) =>
        fakePatient({
          id: `0b6f1c2a-2222-4000-8000-${String(index).padStart(12, "0")}`,
          name: `Paciente ${String(index + 1).padStart(2, "0")}`,
        }),
      ),
    },
  });

  test("navega entre as páginas", async ({ page }) => {
    await page.goto("/pacientes");
    const table = page.getByRole("table");

    await expect(table.getByRole("link").first()).toHaveText("Paciente 01");
    await page.getByRole("button", { name: "Página 3" }).click();

    await expect(table.getByRole("link")).toHaveText([
      "Paciente 41",
      "Paciente 42",
      "Paciente 43",
      "Paciente 44",
      "Paciente 45",
    ]);
  });
});

test.describe("falha da API", () => {
  test.use({ apiOptions: { signedIn: true, patientsStatus: 500 } });

  test("mostra o erro com o código da requisição", async ({ page }) => {
    await page.goto("/pacientes");

    const alert = page.getByRole("alert").filter({ hasText: "Não foi possível carregar os pacientes." });

    await expect(alert).toContainText("req-e2e-patients", { timeout: 15_000 });
    await expect(alert.getByRole("button", { name: "Tentar novamente" })).toBeVisible();
  });
});
