"use client";

import { ApiError } from "@/shared/ApiError";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ToastContainer } from "react-toastify";

interface Props {
  children: React.ReactNode;
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Erros 4xx (não autorizado, não encontrado, validação...) não mudam
        // ao tentar de novo; só repete falhas de rede e erros do servidor.
        retry: (failureCount, error) => {
          const status =
            error instanceof ApiError ? error.statusCode : undefined;

          if (status !== undefined && status >= 400 && status < 500) {
            return false;
          }

          return failureCount < 3;
        },
      },
    },
  });
}

export function Providers({ children }: Props) {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ToastContainer />
    </QueryClientProvider>
  );
}
