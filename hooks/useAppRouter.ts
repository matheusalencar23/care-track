"use client";

import { startNavigationTo } from "@/lib/navigation-progress";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

export function useAppRouter() {
  const router = useRouter();

  return useMemo(
    () => ({
      ...router,
      push: (...args: Parameters<typeof router.push>) => {
        startNavigationTo(args[0]);
        router.push(...args);
      },
      replace: (...args: Parameters<typeof router.replace>) => {
        startNavigationTo(args[0]);
        router.replace(...args);
      },
    }),
    [router],
  );
}
