"use client";

import { useEffect, useMemo } from "react";

const pendingRevocations = new Map<string, ReturnType<typeof setTimeout>>();

export function useObjectUrl(file: Blob, type: string) {
  const url = useMemo(
    () => URL.createObjectURL(new Blob([file], { type })),
    [file, type],
  );

  useEffect(() => {
    clearTimeout(pendingRevocations.get(url));
    pendingRevocations.delete(url);

    return () => {
      pendingRevocations.set(
        url,
        setTimeout(() => {
          URL.revokeObjectURL(url);
          pendingRevocations.delete(url);
        }, 0),
      );
    };
  }, [url]);

  return url;
}
