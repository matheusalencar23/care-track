"use client";

import { useCurrentUser } from "@/hooks/auth/useCurrentUser";

export default function Dashboard() {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    return <header>Carregando...</header>;
  }

  return (
    <main className="absolute z-1 h-screen w-screen overflow-auto">
      <h1>{user?.name}</h1>

    </main>
  );
}
