import { api } from "@/lib/api";
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
  return api.post("/v1/users/signin", data);
}
