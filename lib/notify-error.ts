import { ApiError } from "@/shared/ApiError";
import { toast } from "react-toastify";

const GENERIC_ERROR_MESSAGE =
  "Ocorreu um erro inesperado. Por favor, tente novamente.";

/** Exibe um toast de erro com a mensagem da API ou uma mensagem genérica. */
export function notifyError(err: unknown) {
  toast.error(err instanceof ApiError ? err.message : GENERIC_ERROR_MESSAGE);
}
