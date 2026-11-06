import { test as base, type BrowserContext, type Page, type Route } from "@playwright/test";

export const nurse = {
  name: "Ana Souza",
  email: "ana@exemplo.com",
  password: "senha-segura",
  coren: "123456",
  corenState: "SP",
};

export interface FakePatient {
  id: string;
  name: string;
  birthDate: string;
  cpf: string | null;
  cns: string | null;
  phone: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function fakePatient(overrides: Partial<FakePatient> & Pick<FakePatient, "id" | "name">): FakePatient {
  return {
    birthDate: "1950-03-15",
    cpf: null,
    cns: null,
    phone: null,
    archivedAt: null,
    createdAt: "2026-01-01T12:00:00.000Z",
    updatedAt: "2026-01-01T12:00:00.000Z",
    ...overrides,
  };
}

export const defaultPatients: FakePatient[] = [
  fakePatient({ id: "0b6f1c2a-1111-4000-8000-000000000001", name: "José Antônio Pereira", cpf: "52998224725" }),
  fakePatient({ id: "0b6f1c2a-1111-4000-8000-000000000002", name: "Maria das Dores", birthDate: "1962-08-20", cns: "898001160660004" }),
  fakePatient({
    id: "0b6f1c2a-1111-4000-8000-000000000003",
    name: "Benedita Ramos",
    birthDate: "1938-12-02",
    archivedAt: "2026-10-01T12:00:00.000Z",
  }),
];

const SESSION_IDLE_MS = 30 * 60 * 1000;

function withoutAccents(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

interface ApiOptions {
  signedIn?: boolean;
  meStatus?: number;
  patients?: FakePatient[];
  patientsStatus?: number;
}

export class FakeApi {
  signedIn: boolean;
  meStatus?: number;
  patients: FakePatient[];
  patientsStatus?: number;
  readonly calls: string[] = [];
  readonly patientQueries: URLSearchParams[] = [];
  readonly signupBodies: unknown[] = [];

  constructor(
    private readonly page: Page,
    private readonly context: BrowserContext,
    options: ApiOptions,
  ) {
    this.signedIn = options.signedIn ?? false;
    this.meStatus = options.meStatus;
    this.patients = options.patients ?? defaultPatients;
    this.patientsStatus = options.patientsStatus;
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

    if (call === "GET /patients") {
      return this.listPatients(route, new URL(request.url()).searchParams);
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

    if (call === "POST /users/signup") {
      this.signupBodies.push(request.postDataJSON());

      return route.fulfill({ status: 201, json: {} });
    }

    if (call === "POST /auth/signout") {
      this.signedIn = false;
      await this.context.clearCookies();

      return route.fulfill({ status: 204 });
    }

    return route.fulfill({ status: 404, json: { code: "NOT_FOUND", message: "Rota não simulada" } });
  }

  private listPatients(route: Route, query: URLSearchParams) {
    this.patientQueries.push(query);

    if (this.patientsStatus) {
      return route.fulfill({
        status: this.patientsStatus,
        json: { code: "INTERNAL_SERVER_ERROR", message: "Ocorreu um erro inesperado." },
        headers: { "x-request-id": "req-e2e-patients" },
      });
    }

    const search = query.get("search") ?? "";
    const archived = query.get("status") === "archived";
    const page = Number(query.get("page") ?? 1);
    const limit = Number(query.get("limit") ?? 20);
    const digits = /^\d+$/.test(search);

    const matches = this.patients
      .filter((patient) => Boolean(patient.archivedAt) === archived)
      .filter(
        (patient) =>
          !search ||
          withoutAccents(patient.name).includes(withoutAccents(search)) ||
          (digits && (patient.cpf === search || patient.cns === search)),
      )
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

    return route.fulfill({
      json: {
        items: matches.slice((page - 1) * limit, page * limit),
        page,
        limit,
        total: matches.length,
        totalPages: Math.ceil(matches.length / limit),
      },
      headers: this.sessionHeaders(),
    });
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
