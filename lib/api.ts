import { API_URL } from "@/settings";
import { ApiError } from "@/shared/ApiError";
import axios from "axios";

interface ApiErrorResponse {
  message?: string;
}

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError<ApiErrorResponse>(error)) {
      const message =
        error.response?.data?.message ??
        "Ocorreu um erro inesperado. Por favor, entre em contato com o suporte.";

      throw new ApiError(message, error.response?.status);
    }

    throw error;
  },
);
