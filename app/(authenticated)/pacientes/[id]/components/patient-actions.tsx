"use client";

import Button from "@/app/ui/button";
import ConfirmDialog from "@/app/ui/confirm-dialog";
import LinkButton from "@/app/ui/link-button";
import { useSetPatientArchived } from "@/hooks/patients/useSetPatientArchived";
import type { Patient } from "@/model/patient";
import { useState } from "react";
import { FaArchive, FaPen, FaUndo } from "react-icons/fa";

interface Props {
  patient: Patient;
}

export default function PatientActions({ patient }: Props) {
  const [isConfirming, setIsConfirming] = useState(false);
  const isArchived = Boolean(patient.archivedAt);
  const { setArchived, isPending } = useSetPatientArchived(patient.id, {
    onDone: () => setIsConfirming(false),
  });

  return (
    <div className="flex flex-wrap gap-3">
      {!isArchived && (
        <LinkButton
          href={`/pacientes/${patient.id}/editar`}
          variant="secondary"
          block={false}
        >
          <FaPen aria-hidden className="text-sm" />
          Editar
        </LinkButton>
      )}

      <Button
        type="button"
        variant="secondary"
        block={false}
        onClick={() => setIsConfirming(true)}
        className="inline-flex items-center gap-2"
      >
        {isArchived ? (
          <FaUndo aria-hidden className="text-sm" />
        ) : (
          <FaArchive aria-hidden className="text-sm" />
        )}
        {isArchived ? "Reativar" : "Arquivar"}
      </Button>

      <ConfirmDialog
        open={isConfirming}
        onClose={() => setIsConfirming(false)}
        onConfirm={() => setArchived(!isArchived)}
        isPending={isPending}
        title={isArchived ? "Reativar paciente?" : "Arquivar paciente?"}
        confirmLabel={isArchived ? "Reativar" : "Arquivar"}
        pendingLabel={isArchived ? "Reativando..." : "Arquivando..."}
      >
        {isArchived ? (
          <p>
            <strong>{patient.name}</strong> volta para a lista de pacientes
            ativos e pode ter os dados editados e receber novos registros.
          </p>
        ) : (
          <div className="space-y-3">
            <p>
              <strong>{patient.name}</strong> sai da lista de pacientes ativos e
              não poderá ter os dados editados nem receber novos registros.
            </p>
            <p>
              Nada é apagado: o prontuário continua guardado pelo prazo legal
              (20 anos, Lei 13.787/2018) e pode ser consultado no filtro
              &quot;Arquivados&quot; da lista. Você pode reativar o paciente
              quando precisar.
            </p>
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
}
