import * as authService from "@/services/auth.service";
import { ApiError } from "@/shared/ApiError";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export function useSignup() {
  const router = useRouter();

  async function signup(data: {
    name: string;
    email: string;
    password: string;
  }) {
    try {
      await authService.signup(data);
      toast.success("Usuário cadastrado com sucesso!");
      router.push("/login");
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Ocorreu um erro inesperado. Por favor, tente novamente.");
      }

      throw err;
    }
  }

  return { signup };
}
