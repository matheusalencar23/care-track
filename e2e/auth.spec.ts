import { expect, nurse, test } from "./fixtures";

test.describe("visitante", () => {
  test("é mandado para o login ao abrir a área logada", async ({ page, api }) => {
    await page.goto("/pacientes");

    await expect(page).toHaveURL("/login");
    expect(api.count("GET /auth/me")).toBeLessThanOrEqual(1);
  });

  test("vê os erros de validação do formulário", async ({ page, api }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill("nao-e-email");
    await page.getByLabel("Senha").fill("curta");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.getByText("Email inválido")).toBeVisible();
    await expect(page.getByText("Senha muito curta")).toBeVisible();
    expect(api.count("POST /auth/signin")).toBe(0);
  });

  test("vê a mensagem da API com credenciais erradas", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(nurse.email);
    await page.getByLabel("Senha").fill("senha-errada");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.getByText("Credenciais inválidas!")).toBeVisible();
    await expect(page).toHaveURL("/login");
  });

  test("entra e chega à lista de pacientes", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(nurse.email);
    await page.getByLabel("Senha").fill(nurse.password);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL("/pacientes");
    await expect(page.getByRole("heading", { name: "Pacientes" })).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Navegação principal" }).getByRole("link", { name: "Pacientes" }),
    ).toHaveAttribute("aria-current", "page");
  });
});

test.describe("usuário logado", () => {
  test.use({ apiOptions: { signedIn: true } });

  test("é levado do login para a lista de pacientes", async ({ page }) => {
    await page.goto("/login");

    await expect(page).toHaveURL("/pacientes");
  });

  test("abre o perfil pelo menu do usuário", async ({ page }) => {
    await page.goto("/pacientes");
    await page.getByRole("button", { name: "Menu do usuário" }).click();
    await page.getByRole("menuitem", { name: "Meu perfil" }).click();

    await expect(page).toHaveURL("/perfil");
    await expect(page.getByText(nurse.email)).toBeVisible();
    await expect(page.getByText(`COREN-${nurse.corenState} ${nurse.coren}`)).toBeVisible();
  });

  test("sai e perde o acesso à área logada", async ({ page, api }) => {
    await page.goto("/pacientes");
    await page.getByRole("button", { name: "Menu do usuário" }).click();
    await page.getByRole("menuitem", { name: "Sair" }).click();

    await expect(page).toHaveURL("/login");
    expect(api.count("POST /auth/signout")).toBe(1);

    await page.goto("/pacientes");

    await expect(page).toHaveURL("/login");
  });
});

test.describe("cookie inválido", () => {
  test.use({ apiOptions: { signedIn: true, meStatus: 401 } });

  test("manda para o login avisando que a sessão expirou", async ({ page }) => {
    await page.goto("/pacientes");

    await expect(page).toHaveURL("/login?expired=true");
  });
});

test.describe("API fora do ar", () => {
  test.use({ apiOptions: { signedIn: true, meStatus: 500 } });

  test("mostra o erro com o código para o suporte", async ({ page }) => {
    await page.goto("/pacientes");

    await expect(page.getByText("Não foi possível carregar seus dados.")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("req-e2e-1")).toBeVisible();
    await expect(page.getByRole("button", { name: "Tentar novamente" })).toBeVisible();
  });
});
