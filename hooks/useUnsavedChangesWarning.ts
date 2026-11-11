"use client";

import { guardUnsavedChanges } from "@/lib/unsaved-changes";
import { useEffect } from "react";

export function useUnsavedChangesWarning(hasUnsavedChanges: boolean) {
  useEffect(() => {
    if (hasUnsavedChanges) {
      return guardUnsavedChanges();
    }
  }, [hasUnsavedChanges]);
}
