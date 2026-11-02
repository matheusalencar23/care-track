"use client";

import { queryKeys } from "@/lib/query-keys";
import { getCurrentUser } from "@/services/auth.service";
import { useQuery } from "@tanstack/react-query";

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: getCurrentUser,
    staleTime: 5 * 60 * 1000,
  });
}
