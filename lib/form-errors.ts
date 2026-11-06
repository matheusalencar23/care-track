import { ApiError } from "@/shared/ApiError";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

export function applyFieldErrors<T extends FieldValues>(
  err: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
) {
  if (!(err instanceof ApiError) || err.errors.length === 0) {
    return false;
  }

  let allApplied = true;
  let focused = false;

  for (const issue of err.errors) {
    const field = fields.find((name) => name === issue.path);

    if (issue.location !== "body" || !field) {
      allApplied = false;
      continue;
    }

    setError(field, { type: "server", message: issue.message }, { shouldFocus: !focused });
    focused = true;
  }

  return allApplied;
}
