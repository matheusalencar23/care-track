import { useRouter } from "next/navigation";
import * as authService from "@/services/auth.service";
import { ApiError } from "@/shared/ApiError";
import { toast } from "react-toastify";
import { useQueryClient } from "@tanstack/react-query";

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  async function signout() {
    try {
      await authService.logout();
      queryClient.clear();
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

  return { signout };
}
