import { test as base, type BrowserContext, type Page, type Route } from "@playwright/test";

export const nurse = {
  name: "Ana Souza",
  email: "ana@exemplo.com",
  password: "senha-segura",
  coren: "123456",
  corenState: "SP",
};

const SESSION_IDLE_MS = 30 * 60 * 1000;

interface ApiOptions {
  signedIn?: boolean;
  meStatus?: number;
}

export class FakeApi {
  signedIn: boolean;
  meStatus?: number;
  readonly calls: string[] = [];

  constructor(
    private readonly page: Page,
    private readonly context: BrowserContext,
    options: ApiOptions,
  ) {
    this.signedIn = options.signedIn ?? false;
    this.meStatus = options.meStatus;
  }

  async install() {
    if (this.signedIn) {
      await this.setCookie();
    }

    await this.page.route("**/api/v1/**", (route) => this.handle(route));
  }

  count(call: string) {
    return this.calls.filter((item) => item === call).length;
  }

  private async setCookie() {
    await this.context.addCookies([
      { name: "token", value: "e2e", url: "http://localhost:3100", httpOnly: true, sameSite: "Strict" },
    ]);
  }

  private sessionHeaders() {
    const now = Date.now();

    return {
      "x-session-expires-at": new Date(now + SESSION_IDLE_MS).toISOString(),
      date: new Date(now).toUTCString(),
    };
  }

  private async handle(route: Route) {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace("/api/v1", "");
    const call = `${request.method()} ${path}`;
    this.calls.push(call);

    if (call === "GET /auth/me") {
      const status = this.meStatus ?? (this.signedIn ? 200 : 401);

      if (status === 200) {
        return route.fulfill({
          json: { ...nurse, password: undefined, sessionExpiresAt: this.sessionHeaders()["x-session-expires-at"] },
          headers: this.sessionHeaders(),
        });
      }

      return route.fulfill({
        status,
        json: status === 401
          ? { code: "UNAUTHORIZED", message: "Sessão inválida ou expirada. Faça login novamente." }
          : { code: "INTERNAL_SERVER_ERROR", message: "Ocorreu um erro inesperado." },
        headers: { "x-request-id": "req-e2e-1" },
      });
    }

    if (call === "POST /auth/signin") {
      const body = request.postDataJSON() as { email: string; password: string };

      if (body.email !== nurse.email || body.password !== nurse.password) {
        return route.fulfill({
          status: 400,
          json: { code: "INVALID_CREDENTIALS", message: "Credenciais inválidas!" },
        });
      }

      this.signedIn = true;
      await this.setCookie();

      return route.fulfill({ json: { message: "ok" }, headers: this.sessionHeaders() });
    }

    if (call === "POST /auth/signout") {
      this.signedIn = false;
      await this.context.clearCookies();

      return route.fulfill({ status: 204 });
    }

    return route.fulfill({ status: 404, json: { code: "NOT_FOUND", message: "Rota não simulada" } });
  }
}

export const test = base.extend<{ api: FakeApi; apiOptions: ApiOptions; cspViolations: string[] }>({
  apiOptions: [{}, { option: true }],
  api: [
    async ({ page, context, apiOptions }, use) => {
      const api = new FakeApi(page, context, apiOptions);
      await api.install();
      await use(api);
    },
    { auto: true },
  ],
  cspViolations: [
    async ({ page }, use) => {
      const violations: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error" && /Content Security Policy/i.test(message.text())) {
          violations.push(message.text());
        }
      });
      await use(violations);
    },
    { auto: true },
  ],
});

export { expect } from "@playwright/test";
