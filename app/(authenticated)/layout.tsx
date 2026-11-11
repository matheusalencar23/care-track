"use client";

import { useCurrentUser } from "@/hooks/auth/useCurrentUser";
import { useEffect } from "react";
import { useAppRouter } from "@/hooks/useAppRouter";
import { ApiError } from "@/shared/ApiError";
import RequestId from "@/app/ui/request-id";
import AppHeader from "./components/app-header";
import SessionTimeout from "./components/session-timeout";

export default function AuthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { data: user, error, refetch } = useCurrentUser();
  const router = useAppRouter();

  const isUnauthorized = error instanceof ApiError && error.statusCode === 401;

  useEffect(() => {
    if (isUnauthorized) {
      router.replace("/login?expired=true");
    }
  }, [isUnauthorized, router]);

  if (error && !isUnauthorized) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center text-white">
        <p>Não foi possível carregar seus dados. Verifique sua conexão.</p>

        <RequestId error={error} />

        <button
          type="button"
          onClick={() => refetch()}
          className="cursor-pointer rounded-xl bg-white px-6 py-2.5 font-semibold text-blue-700 transition hover:scale-[1.02]"
        >
          Tentar novamente
        </button>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center text-white">
        Carregando...
      </main>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader user={user} />
      <SessionTimeout />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 text-white sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
