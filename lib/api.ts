import { ApiError } from "@/shared/ApiError";
import axios from "axios";

interface ApiErrorResponse {
  code?: string;
  message?: string;
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
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError<ApiErrorResponse>(error)) {
      if (error.response?.status === 401 && !error.config?.skipAuthRedirect) {
        if (
          typeof window !== "undefined" &&
          window.location.pathname !== "/login"
        ) {
          window.location.href = "/login?expired=true";
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

      throw new ApiError(message, {
        statusCode: error.response.status,
        code: error.response.data?.code,
        requestId: typeof requestId === "string" ? requestId : undefined,
      });
    }

    throw error;
  },
);
