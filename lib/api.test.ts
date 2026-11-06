import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, hasErrorCode, isInvalidTokenError } from "@/shared/ApiError";
import { api } from "./api";
import { clearSession, getSessionSnapshot } from "./session";

interface FakeResponse {
  status: number;
  data?: unknown;
  headers?: Record<string, string>;
}

function respondWith(response: FakeResponse | "network-error") {
  api.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    if (response === "network-error") {
      throw new AxiosError("Network Error", "ERR_NETWORK", config);
    }

    const result = {
      config,
      status: response.status,
      statusText: "",
      data: response.data,
      headers: new AxiosHeaders(response.headers ?? {}),
    };

    if (response.status >= 400) {
      throw new AxiosError(
        "Request failed",
        "ERR_BAD_RESPONSE",
        config,
        null,
        result,
      );
    }

    return result;
  };
}

async function captureError(request: Promise<unknown>) {
  try {
    await request;
  } catch (error) {
    return error;
  }

  throw new Error("A requisição deveria ter falhado");
}

let location: { pathname: string; href: string };

beforeEach(() => {
  location = { pathname: "/pacientes", href: "http://localhost/pacientes" };
  vi.stubGlobal("location", location);
  vi.stubGlobal("BroadcastChannel", undefined);
  clearSession();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("api", () => {
  it("guarda a expiração da sessão enviada pela API", async () => {
    const now = Date.now();
    respondWith({
      status: 200,
      data: { ok: true },
      headers: {
        "x-session-expires-at": new Date(now + 30 * 60 * 1000).toISOString(),
        date: new Date(now).toUTCString(),
      },
    });

    const response = await api.get("/auth/me");

    expect(response.data).toEqual({ ok: true });
    expect(getSessionSnapshot()?.expiresAt).toBeGreaterThan(now + 29 * 60 * 1000);
  });

  it("converte a resposta de erro em ApiError com code e requestId", async () => {
    respondWith({
      status: 409,
      data: { code: "PATIENT_ARCHIVED", message: "Este paciente está arquivado." },
      headers: { "x-request-id": "req-123" },
    });

    const error = await captureError(api.put("/patients/1", {}));

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      message: "Este paciente está arquivado.",
      statusCode: 409,
      code: "PATIENT_ARCHIVED",
      requestId: "req-123",
    });
    expect(hasErrorCode(error, "PATIENT_ARCHIVED")).toBe(true);
    expect(hasErrorCode(error, "PATIENT_NOT_FOUND")).toBe(false);
  });

  it("usa uma mensagem genérica quando a API não manda uma", async () => {
    respondWith({ status: 500, data: "<html>" });

    const error = await captureError(api.get("/patients"));

    expect(error).toMatchObject({
      message: "Ocorreu um erro inesperado. Por favor, entre em contato com o suporte.",
      statusCode: 500,
    });
  });

  it("explica a falha de conexão quando não há resposta", async () => {
    respondWith("network-error");

    const error = await captureError(api.get("/patients"));

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).message).toMatch(/Não foi possível conectar/);
    expect((error as ApiError).statusCode).toBeUndefined();
  });

  it("limpa a sessão e manda para o login em um 401", async () => {
    respondWith({
      status: 200,
      headers: { "x-session-expires-at": new Date(Date.now() + 60_000).toISOString() },
    });
    await api.get("/auth/me");
    respondWith({ status: 401, data: { code: "UNAUTHORIZED", message: "Sessão expirada" } });

    await captureError(api.get("/patients"));

    expect(getSessionSnapshot()).toBeNull();
    expect(location.href).toBe("/login?expired=true");
  });

  it("não redireciona quando a requisição pede skipAuthRedirect", async () => {
    respondWith({ status: 401, data: { code: "UNAUTHORIZED", message: "Sessão expirada" } });

    const error = await captureError(api.get("/auth/me", { skipAuthRedirect: true }));

    expect((error as ApiError).statusCode).toBe(401);
    expect(location.href).toBe("http://localhost/pacientes");
  });

  it("não redireciona quem já está no login", async () => {
    location.pathname = "/login";
    respondWith({ status: 401, data: { code: "INVALID_CREDENTIALS", message: "Credenciais inválidas!" } });

    await captureError(api.post("/auth/signin", {}));

    expect(location.href).toBe("http://localhost/pacientes");
  });
});

describe("isInvalidTokenError", () => {
  it("reconhece o token de link inválido pelo code", () => {
    expect(isInvalidTokenError(new ApiError("x", { code: "INVALID_LINK_TOKEN" }))).toBe(true);
    expect(isInvalidTokenError(new ApiError("x", { code: "EMAIL_ALREADY_VERIFIED" }))).toBe(false);
    expect(isInvalidTokenError(new Error("INVALID_LINK_TOKEN"))).toBe(false);
  });
});
