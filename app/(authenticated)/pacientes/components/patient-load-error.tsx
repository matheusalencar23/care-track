import Button from "@/app/ui/button";
import EmptyState from "@/app/ui/empty-state";
import LinkButton from "@/app/ui/link-button";
import RequestId from "@/app/ui/request-id";
import { ApiError, hasErrorCode } from "@/shared/ApiError";
import { FaUserSlash } from "react-icons/fa";

interface Props {
  error: unknown;
  onRetry: () => void;
}

export function isPatientNotFound(error: unknown) {
  return (
    hasErrorCode(error, "PATIENT_NOT_FOUND") ||
    (error instanceof ApiError &&
      error.statusCode === 422 &&
      error.errors.some((issue) => issue.location === "params"))
  );
}

export default function PatientLoadError({ error, onRetry }: Props) {
  if (isPatientNotFound(error)) {
    return (
      <EmptyState
        icon={FaUserSlash}
        title="Paciente não encontrado"
        description="O endereço pode estar errado, ou o paciente não está na sua lista."
        action={
          <LinkButton href="/pacientes" block={false}>
            Voltar para pacientes
          </LinkButton>
        }
      />
    );
  }

  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-white/10 px-6 py-12 text-center shadow-2xl backdrop-blur-2xl"
    >
      <p>Não foi possível carregar o paciente.</p>
      <RequestId error={error} />
      <Button type="button" variant="secondary" block={false} onClick={onRetry}>
        Tentar novamente
      </Button>
    </div>
  );
}
