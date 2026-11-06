import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, renderHook } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function wrapperFor(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

export function renderWithQueryClient(ui: ReactElement, queryClient = createTestQueryClient()) {
  return { queryClient, ...render(ui, { wrapper: wrapperFor(queryClient) }) };
}

export function renderHookWithQueryClient<T>(hook: () => T, queryClient = createTestQueryClient()) {
  return { queryClient, ...renderHook(hook, { wrapper: wrapperFor(queryClient) }) };
}
