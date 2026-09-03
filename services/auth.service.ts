import { api } from "@/lib/api";
import { ApiError } from "@/shared/ApiError";

export async function validateSession(cookieHeader: string) {
  try {
    return await api.get("/v1/auth/me", {
      headers: {
        ...(cookieHeader && { Cookie: cookieHeader }),
      },
    });
  } catch (err: unknown) {
    if (
      err instanceof ApiError &&
      (err.statusCode === 401 || err.statusCode === 403)
    ) {
      return null;
    }

    throw err;
  }
}

export function loginRequest(data: { email: string; password: string }) {
  return api.post("/v1/auth/signin", data);
}

export function signupRequest(data: {
  name: string;
  email: string;
  password: string;
}) {
  return api.post("/v1/users/signup", data);
}
