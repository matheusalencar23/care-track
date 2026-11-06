import { expect, test } from "./fixtures";

test.use({ apiOptions: { signedIn: true } });

test.beforeEach(async ({ page }) => {
  await page.clock.install();
  await page.goto("/pacientes");
  await expect(page.getByRole("heading", { name: "Pacientes" })).toBeVisible();
});

test("avisa antes de expirar e renova ao continuar", async ({ page, api }) => {
  const dialog = page.getByRole("dialog", { name: "Você ainda está aí?" });
  const meCalls = api.count("GET /auth/me");

  await page.clock.fastForward("27:00");
  await expect(dialog).toBeHidden();

  await page.clock.fastForward("01:30");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Continuar conectado" })).toBeFocused();

  await dialog.getByRole("button", { name: "Continuar conectado" }).click();

  await expect(dialog).toBeHidden();
  expect(api.count("GET /auth/me")).toBe(meCalls + 1);
  await expect(page).toHaveURL("/pacientes");
});

test("encerra a sessão por inatividade", async ({ page, api }) => {
  await page.clock.fastForward("30:01");

  await expect(page).toHaveURL("/login?expired=true");
  expect(api.count("POST /auth/signout")).toBe(0);
});

test("renova em silêncio quando há atividade", async ({ page, api }) => {
  const meCalls = api.count("GET /auth/me");

  await page.clock.fastForward("06:00");
  await page.keyboard.press("Shift");

  await expect.poll(() => api.count("GET /auth/me")).toBe(meCalls + 1);

  await page.keyboard.press("Shift");
  await page.mouse.click(10, 300);

  expect(api.count("GET /auth/me")).toBe(meCalls + 1);
});
