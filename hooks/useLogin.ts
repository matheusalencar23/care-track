"use client";

import { useRouter } from "next/navigation";
import { loginRequest } from "../services/auth";

export function useLogin() {
  const router = useRouter();

  async function login(data: { email: string; password: string }) {
    await loginRequest(data);
    router.push("/dashboard");
  }

  return { login };
}
