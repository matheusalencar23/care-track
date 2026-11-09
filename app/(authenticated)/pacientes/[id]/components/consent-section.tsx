"use client";

import Badge from "@/app/ui/badge";
import Button from "@/app/ui/button";
import RequestId from "@/app/ui/request-id";
import Skeleton from "@/app/ui/skeleton";
import { useConsents } from "@/hooks/consents/useConsents";
import { consentNeedsRenewal } from "@/lib/consents";
import { formatDateTime } from "@/lib/dates";
import type { Consent, ConsentMethod } from "@/model/consent";
import type { Patient } from "@/model/patient";
import { useEffect, useRef, useState } from "react";
import GrantConsentDialog from "./grant-consent-dialog";
import RevokeConsentDialog from "./revoke-consent-dialog";

interface Props {
  patient: Patient;
}

const methodLabels: Record<ConsentMethod, string> = {
  written: "Por escrito",
  verbal: "Verbal",
};

function grantorLabel(consent: Consent) {
  return consent.grantor === "legal_representative"
    ? `${consent.representativeName} (responsável legal)`
    : "O próprio paciente";
}

function ActiveConsent({ consent }: { consent: Consent }) {
  const fields = [
    { label: "Forma da coleta", value: methodLabels[consent.method] },
    { label: "Quem autorizou", value: grantorLabel(consent) },
    { label: "Coletada em", value: formatDateTime(consent.collectedAt) },
  ];

  return (
    <dl className="mt-5 grid gap-5 sm:grid-cols-3">
      {fields.map(({ label, value }) => (
        <div key={label}>
          <dt className="text-sm text-slate-300">{label}</dt>
          <dd className="mt-1 break-words font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function RevokedConsents({ consents }: { consents: Consent[] }) {
  return (
    <details className="mt-6 border-t border-white/10 pt-4">
      <summary className="cursor-pointer text-sm font-semibold text-slate-200 hover:text-white">
        Autorizações revogadas ({consents.length})
      </summary>

      <ul className="mt-4 space-y-4">
        {consents.map((consent) => (
          <li key={consent.id} className="text-sm text-slate-200">
            <p className="font-medium text-white">
              {methodLabels[consent.method]}: {grantorLabel(consent)}
            </p>
            <p className="mt-1">
              Coletada em {formatDateTime(consent.collectedAt)}
              {consent.revokedAt &&
                `, revogada em ${formatDateTime(consent.revokedAt)}`}
            </p>
            {consent.revocationReason && (
              <p className="mt-1 break-words">
                Motivo: {consent.revocationReason}
              </p>
            )}
          </li>
        ))}
      </ul>
    </details>
  );
}

export default function ConsentSection({ patient }: Props) {
  const { data: consents, error, isPending, refetch } = useConsents(patient.id);
  const [openDialog, setOpenDialog] = useState<"grant" | "revoke" | null>(null);
  const [dialogKey, setDialogKey] = useState(0);
  const openedOnce = useRef(false);

  const active = consents?.find((consent) => consent.status === "active");
  const revoked = consents?.filter((consent) => consent.status === "revoked") ?? [];
  const isArchived = Boolean(patient.archivedAt);
  const needsRenewal = active
    ? consentNeedsRenewal(active, patient.birthDate)
    : false;
  const canRenew = needsRenewal && !isArchived;
  const canAct = consents && (active || !isArchived);
  const mainButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!canRenew && document.activeElement === document.body && openedOnce.current) {
      mainButtonRef.current?.focus();
    }
  }, [canRenew]);

  function open(dialog: "grant" | "revoke") {
    openedOnce.current = true;
    setDialogKey((key) => key + 1);
    setOpenDialog(dialog);
  }

  function closeDialog() {
    setOpenDialog(null);
  }

  return (
    <section
      aria-labelledby="patient-consent-title"
      className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-2xl sm:p-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="patient-consent-title" className="text-lg font-semibold">
            Autorização de uso de imagem
          </h2>

          {consents &&
            (needsRenewal ? (
              <Badge tone="warning">Renovação necessária</Badge>
            ) : active ? (
              <Badge tone="success">Autorizado</Badge>
            ) : (
              <Badge>Sem autorização</Badge>
            ))}
        </div>

        {canAct && (
          <div className="flex flex-wrap gap-3">
            <Button
              ref={mainButtonRef}
              type="button"
              variant="secondary"
              block={false}
              onClick={() => open(active && !canRenew ? "revoke" : "grant")}
            >
              {canRenew
                ? "Renovar autorização"
                : active
                  ? "Revogar"
                  : "Registrar autorização"}
            </Button>

            {canRenew && (
              <Button
                type="button"
                variant="secondary"
                block={false}
                onClick={() => open("revoke")}
              >
                Revogar
              </Button>
            )}
          </div>
        )}
      </div>

      {isPending ? (
        <div aria-busy className="mt-5 space-y-3">
          <span className="sr-only">Carregando autorizações...</span>
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ) : !consents ? (
        <div role="alert" className="mt-5 space-y-3 text-sm">
          <p>Não foi possível carregar as autorizações.</p>
          <RequestId error={error} />
          <Button
            type="button"
            variant="secondary"
            block={false}
            onClick={() => refetch()}
          >
            Tentar novamente
          </Button>
        </div>
      ) : active ? (
        <>
          {needsRenewal && (
            <p className="mt-3 text-sm text-warning-400">
              Esta autorização foi dada pelo responsável legal quando o paciente
              era menor de idade. Ele já completou 18 anos: não use novas fotos
              ou vídeos até registrar a autorização dele.
              {isArchived && " Para renovar, reative o paciente."}
            </p>
          )}
          <ActiveConsent consent={active} />
        </>
      ) : (
        <p className="mt-3 text-sm text-slate-300">
          Fotos e vídeos do paciente exigem uma autorização registrada, mesmo
          com finalidade clínica.
          {isArchived &&
            " Paciente arquivado não recebe novas autorizações; reative-o para registrar."}
        </p>
      )}

      {revoked.length > 0 && <RevokedConsents consents={revoked} />}

      {!isArchived && (!active || needsRenewal) && (
        <GrantConsentDialog
          key={`grant-${dialogKey}`}
          patient={patient}
          open={openDialog === "grant"}
          onClose={closeDialog}
          replacesConsentId={needsRenewal ? active?.id : undefined}
        />
      )}

      {active && (
        <RevokeConsentDialog
          key={`revoke-${dialogKey}`}
          consent={active}
          open={openDialog === "revoke"}
          onClose={closeDialog}
        />
      )}
    </section>
  );
}
