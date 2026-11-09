import { clearSession, recordSessionExpiry } from "@/lib/session";
import { ApiError, type ValidationIssue } from "@/shared/ApiError";
import axios from "axios";

interface ApiErrorResponse {
  code?: string;
  message?: string;
  errors?: unknown;
}

function isValidationIssue(value: unknown): value is ValidationIssue {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const issue = value as Record<string, unknown>;

  return (
    typeof issue.location === "string" &&
    typeof issue.path === "string" &&
    typeof issue.message === "string"
  );
}

declare module "axios" {
  interface AxiosRequestConfig {
    /**
     * Quando `true`, um 401 não redireciona automaticamente para o login;
     * quem fez a chamada decide o que fazer (ex.: checagem de sessão).
     */
    skipAuthRedirect?: boolean;
  }
}

export const api = axios.create({
  baseURL: "/api/v1",
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => {
    const expiresAt = response.headers["x-session-expires-at"];
    const date = response.headers["date"];

    if (typeof expiresAt === "string") {
      recordSessionExpiry(
        expiresAt,
        typeof date === "string" ? date : undefined,
      );
    }

    return response;
  },
  (error: unknown) => {
    if (axios.isAxiosError<ApiErrorResponse>(error)) {
      if (error.response?.status === 401) {
        clearSession();
      }

      if (error.response?.status === 401 && !error.config?.skipAuthRedirect) {
        if (
          typeof window !== "undefined" &&
          window.location.pathname !== "/login"
        ) {
          window.location.replace("/login?expired=true");
        }
      }

      // Sem resposta: servidor fora do ar, sem internet, CORS, timeout etc.
      if (!error.response) {
        throw new ApiError(
          "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.",
        );
      }

      const message =
        error.response.data?.message ??
        "Ocorreu um erro inesperado. Por favor, entre em contato com o suporte.";

      const requestId = error.response.headers["x-request-id"];
      const errors = error.response.data?.errors;

      throw new ApiError(message, {
        statusCode: error.response.status,
        code: error.response.data?.code,
        requestId: typeof requestId === "string" ? requestId : undefined,
        errors: Array.isArray(errors) ? errors.filter(isValidationIssue) : [],
      });
    }

    throw error;
  },
);
