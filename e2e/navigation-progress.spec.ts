import type { Page } from "@playwright/test";
import { expect, fakePatient, test } from "./fixtures";

test.use({
  apiOptions: {
    signedIn: true,
    patients: [fakePatient({ id: "0b6f1c2a-1111-4000-8000-000000000001", name: "José Antônio Pereira" })],
  },
});

async function delayPage(page: Page, matches: (pathname: string) => boolean, ms = 800) {
  await page.route(
    (url) => matches(url.pathname),
    async (route) => {
      if (route.request().headers()["rsc"]) {
        await new Promise((resolve) => setTimeout(resolve, ms));
      }
      await route.fallback();
    },
  );
}

test("mostra a barra durante uma navegação demorada por link", async ({ page, cspViolations }) => {
  await page.goto("/pacientes");
  await expect(page.getByRole("heading", { level: 1, name: "Pacientes" })).toBeVisible();
  await delayPage(page, (pathname) => pathname === "/perfil");
  const progress = page.getByRole("progressbar", { name: "Carregando a página" });

  await page.getByRole("button", { name: /^Menu do usuário/ }).click();
  await page.getByRole("link", { name: "Meu perfil" }).click();

  await expect(progress).toBeVisible();
  await expect(page).toHaveURL("/perfil");
  await expect(progress).toBeHidden();
  expect(cspViolations).toEqual([]);
});

test("mostra a barra na navegação feita por código, depois de cadastrar", async ({ page }) => {
  await page.goto("/pacientes/novo");
  await delayPage(page, (pathname) => /^\/pacientes\/[0-9a-f-]{36}$/.test(pathname));
  const progress = page.getByRole("progressbar", { name: "Carregando a página" });

  await page.getByRole("textbox", { name: "Nome completo" }).fill("Ana Souza");
  await page.getByLabel("Data de nascimento").fill("1980-05-10");
  await page.getByRole("button", { name: "Cadastrar paciente" }).click();

  await expect(progress).toBeVisible();
  await expect(page).toHaveURL(/\/pacientes\/[0-9a-f-]{36}$/);
  await expect(progress).toBeHidden();
});

test("não anima para quem prefere movimento reduzido", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/pacientes");
  await expect(page.getByRole("heading", { level: 1, name: "Pacientes" })).toBeVisible();
  await delayPage(page, (pathname) => pathname === "/perfil", 1500);

  await page.getByRole("button", { name: /^Menu do usuário/ }).click();
  await page.getByRole("link", { name: "Meu perfil" }).click();

  const bar = page.getByRole("progressbar", { name: "Carregando a página" }).locator("div");
  await expect(bar).toBeVisible();
  expect(await bar.evaluate((element) => getComputedStyle(element).animationName)).toBe("none");
});

