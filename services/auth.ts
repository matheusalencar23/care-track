import { api } from "@/lib/api";
import { ApiError } from "@/shared/ApiError";
import axios from "axios";

export async function validateSession(cookieHeader: string) {
  try {
    return await api.get("/v1/users/me", {
      headers: {
        ...(cookieHeader && { Cookie: cookieHeader }),
      },
    });
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      console.error("Erro ao validar sessão: ", err.message);
    }
    return null;
  }
}

export async function loginRequest(data: { email: string; password: string }) {
  return await api.post("/v1/users/signin", data);
}

export async function signupRequest(data: {
  name: string;
  email: string;
  password: string;
}) {
  try {
    return await api.post("/v1/users/signup", data);
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      throw (
        new ApiError(err.response?.data.message) ??
        "Ocorreu um erro inesperado. Por favor, entre em contato com o suporte."
      );
    }

    throw err;
  }
}
