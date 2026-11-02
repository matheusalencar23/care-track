import { useRouter } from "next/navigation";
import * as authService from "@/services/auth.service";
import { notifyError } from "@/lib/notify-error";
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
      notifyError(err);
    }
  }

  return { signout };
}
