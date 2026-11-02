"use client";

import { useCurrentUser } from "@/hooks/auth/useCurrentUser";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface Props {
  children: React.ReactNode;
}

/**
 * Envolve páginas públicas de autenticação (login, cadastro): se já houver
 * uma sessão ativa, redireciona para o dashboard. O conteúdo é exibido
 * imediatamente para não atrasar quem não está logado.
 */
export default function GuestOnly({ children }: Props) {
  const { data: user } = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  return children;
}
