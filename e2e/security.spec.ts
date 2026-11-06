import { expect, test } from "./fixtures";

const publicPages = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/verify-email",
  "/termos",
  "/privacidade",
];

for (const path of publicPages) {
  test(`${path} carrega sem violar a CSP`, async ({ page, cspViolations }) => {
    const response = await page.goto(path);
    await page.waitForLoadState("networkidle");

    const csp = response?.headers()["content-security-policy"] ?? "";
    const nonce = /'nonce-([^']+)'/.exec(csp)?.[1];

    expect(nonce).toBeTruthy();
    expect(csp).toContain("frame-ancestors 'none'");
    expect(response?.headers()["x-frame-options"]).toBe("DENY");
    expect(cspViolations).toEqual([]);
  });
}

test.describe("área logada", () => {
  test.use({ apiOptions: { signedIn: true } });

  test("carrega sem violar a CSP", async ({ page, cspViolations }) => {
    await page.goto("/pacientes");
    await expect(page.getByRole("heading", { name: "Pacientes" })).toBeVisible();
    await page.goto("/perfil");
    await page.waitForLoadState("networkidle");

    expect(cspViolations).toEqual([]);
  });
});

test("bloqueia o JavaScript de um HTML injetado", async ({ page, cspViolations }) => {
  await page.goto("/login");

  await page.evaluate(() => {
    const container = document.createElement("div");
    container.innerHTML = '<img src="/x.png" onerror="window.__injected = true">';
    document.body.appendChild(container);
  });
  await expect.poll(() => cspViolations.length).toBeGreaterThan(0);

  const executed = await page.evaluate(
    () => (window as unknown as { __injected?: boolean }).__injected === true,
  );

  expect(executed).toBe(false);
});
