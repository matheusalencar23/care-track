import RequestId from "@/app/ui/request-id";
import { ApiError } from "@/shared/ApiError";
import { toast } from "react-toastify";

const GENERIC_ERROR_MESSAGE =
  "Ocorreu um erro inesperado. Por favor, tente novamente.";

/** Exibe um toast de erro com a mensagem da API ou uma mensagem genérica. */
export function notifyError(err: unknown) {
  if (!(err instanceof ApiError)) {
    toast.error(GENERIC_ERROR_MESSAGE);
    return;
  }

  const isServerError = (err.statusCode ?? 0) >= 500;

  toast.error(
    <div>
      <p>{err.message}</p>
      {isServerError && <RequestId error={err} className="mt-1" />}
    </div>,
  );
}
