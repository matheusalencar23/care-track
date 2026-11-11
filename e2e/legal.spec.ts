import { TERMS_VERSION } from "../lib/legal";
import { expect, test } from "./fixtures";

test("os documentos legais são públicos e apontam um para o outro", async ({ page }) => {
  await page.goto("/termos");

  await expect(page.getByRole("heading", { level: 1, name: "Termos de Uso" })).toBeVisible();
  await expect(page).toHaveTitle("Termos de Uso | CareTrack");

  await page
    .getByRole("navigation", { name: "Documentos legais" })
    .getByRole("link", { name: "Política de Privacidade" })
    .click();

  await expect(page).toHaveURL("/privacidade");
  await expect(
    page.getByRole("heading", { level: 1, name: "Política de Privacidade" }),
  ).toBeVisible();
});

test("o login mostra os links no rodapé e a área logada, no menu do usuário", async ({ page, api }) => {
  await page.goto("/login");

  await expect(
    page.getByRole("navigation", { name: "Documentos legais" }).getByRole("link", { name: "Termos de Uso" }),
  ).toBeVisible();

  api.signedIn = true;
  await page.context().addCookies([{ name: "token", value: "e2e", url: "http://localhost:3100" }]);
  await page.goto("/pacientes");
  await expect(page.getByRole("heading", { level: 1, name: "Pacientes" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Documentos legais" })).toHaveCount(0);

  await page.getByRole("button", { name: /^Menu do usuário/ }).click();
  const [privacyTab] = await Promise.all([
    page.context().waitForEvent("page"),
    page.getByRole("link", { name: "Política de Privacidade (abre em outra aba)" }).click(),
  ]);

  await expect(privacyTab).toHaveURL("/privacidade");
  await expect(page).toHaveURL("/pacientes");
  await expect(page.getByRole("link", { name: "Termos de Uso (abre em outra aba)" })).toBeHidden();
});

test("o cadastro exige o aceite e envia a versão dos termos", async ({ page, api }) => {
  await page.goto("/signup");
  await page.getByLabel("Nome").fill("Ana Souza");
  await page.getByLabel("E-mail").fill("ana@exemplo.com");
  await page.getByLabel("COREN").fill("123456");
  await page.getByLabel("UF").selectOption("SP");
  await page.getByLabel("Senha").fill("senha-segura");
  await page.getByRole("button", { name: "Cadastrar" }).click();

  await expect(
    page.getByText("Para criar a conta, aceite os Termos de Uso e a Política de Privacidade"),
  ).toBeVisible();
  expect(api.signupBodies).toEqual([]);

  const [termsTab] = await Promise.all([
    page.context().waitForEvent("page"),
    page.locator("form").getByRole("link", { name: "Termos de Uso" }).click(),
  ]);
  await expect(termsTab).toHaveURL("/termos");
  await expect(page.getByLabel("Nome")).toHaveValue("Ana Souza");

  await page.getByRole("checkbox", { name: /Li e aceito/ }).check();
  await page.getByRole("button", { name: "Cadastrar" }).click();

  await expect(page).toHaveURL("/login");
  expect(api.signupBodies).toEqual([
    {
      name: "Ana Souza",
      email: "ana@exemplo.com",
      coren: "123456",
      corenState: "SP",
      password: "senha-segura",
      acceptedTermsVersion: TERMS_VERSION,
    },
  ]);
});
