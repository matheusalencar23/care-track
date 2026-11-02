"use client";

import { useCurrentUser } from "@/hooks/auth/useCurrentUser";

export default function Dashboard() {
  // O layout autenticado só renderiza a página depois de carregar o usuário.
  const { data: user } = useCurrentUser();

  return (
    <main className="flex-1 p-6 text-white">
      <h1 className="text-2xl font-semibold">{user?.name}</h1>
    </main>
  );
}
