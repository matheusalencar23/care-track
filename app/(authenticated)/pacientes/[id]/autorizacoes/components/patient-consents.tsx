"use client";

import Badge from "@/app/ui/badge";
import Skeleton from "@/app/ui/skeleton";
import { usePatient } from "@/hooks/patients/usePatient";
import BackLink from "../../../components/back-link";
import PatientLoadError from "../../../components/patient-load-error";
import ConsentSection from "../../components/consent-section";

interface Props {
  id: string;
}

export default function PatientConsents({ id }: Props) {
  const { data: patient, error, isPending, refetch } = usePatient(id);
  const backHref = `/pacientes/${encodeURIComponent(id)}`;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <BackLink href={backHref}>Voltar ao paciente</BackLink>

        <h1 className="mt-2 text-2xl font-semibold">
          Autorização de uso de imagem
        </h1>

        {patient && (
          <p className="mt-1 flex flex-wrap items-center gap-3 text-slate-300">
            <span className="break-words">
              Paciente: <span className="text-white">{patient.name}</span>
            </span>
            {patient.archivedAt && <Badge tone="warning">Arquivado</Badge>}
          </p>
        )}

        <p className="mt-3 text-sm text-slate-300">
          Fotos e vídeos do paciente só podem ser anexados e abertos com uma
          autorização ativa. A autorização vale para o uso clínico no
          prontuário; as revogadas continuam listadas.
        </p>
      </div>

      {isPending ? (
        <div aria-busy className="space-y-3">
          <span className="sr-only">Carregando paciente...</span>
          <Skeleton className="h-40 w-full" />
        </div>
      ) : patient ? (
        <ConsentSection patient={patient} />
      ) : (
        <PatientLoadError error={error} onRetry={() => refetch()} />
      )}
    </div>
  );
}
