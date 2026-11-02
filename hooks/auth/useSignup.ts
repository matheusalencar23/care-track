import * as authService from "@/services/auth.service";
import { notifyError } from "@/lib/notify-error";
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
      notifyError(err);
    }
  }

  return { signup };
}
