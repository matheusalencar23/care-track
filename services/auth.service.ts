import { api } from "@/lib/api";
import { User } from "@/model/user";

export async function getCurrentUser(): Promise<User> {
  const response = await api.get("/auth/me");
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

export async function signup(data: {
  name: string;
  email: string;
  password: string;
}) {
  const response = await api.post("/users/signup", data);
  return response.data;
}
