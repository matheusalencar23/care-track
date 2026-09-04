import { useRouter } from "next/navigation";
import * as authService from "@/services/auth.service";
import { ApiError } from "@/shared/ApiError";
import { toast } from "react-toastify";

export function useLogout() {
  const router = useRouter();

  async function signout() {
    try {
      await authService.logout();
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
