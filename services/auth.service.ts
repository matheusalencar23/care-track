import { api } from "@/lib/api";
import { SignupData, User } from "@/model/user";

export async function getCurrentUser(): Promise<User> {
  // O 401 aqui significa apenas "não logado"; quem usa decide se redireciona.
  const response = await api.get("/auth/me", { skipAuthRedirect: true });
  return response.data;
}

export async function login(data: { email: string; password: string }) {
  const response = await api.post("/auth/signin", data);
  return response.data;
}

export async function logout() {
  const response = await api.post("/auth/signout", {});
  return response.data;
}

export async function signup(data: SignupData) {
  const response = await api.post("/users/signup", data);
  return response.data;
}

export async function verifyEmail(token: string) {
  const response = await api.get("/users/validate", { params: { token } });
  return response.data;
}

export async function resendVerificationEmail(email: string) {
  const response = await api.post("/users/resend", { email });
  return response.data;
}

export async function forgotPassword(email: string) {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data;
}

export async function resetPassword(data: { token: string; password: string }) {
  const response = await api.post("/auth/reset-password", data);
  return response.data;
}
