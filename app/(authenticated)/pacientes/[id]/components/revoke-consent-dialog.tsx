"use client";

import ConfirmDialog from "@/app/ui/confirm-dialog";
import Textarea from "@/app/ui/textarea";
import { useRevokeConsent } from "@/hooks/consents/useRevokeConsent";
import type { Consent } from "@/model/consent";
import { useState } from "react";

interface Props {
  consent: Consent;
  open: boolean;
  onClose: () => void;
}

export default function RevokeConsentDialog({ consent, open, onClose }: Props) {
  const [reason, setReason] = useState("");
  const { revokeConsent, isPending } = useRevokeConsent(consent.patientId, {
    onDone: onClose,
  });

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={() =>
        revokeConsent({ consentId: consent.id, reason: reason.trim() || undefined })
      }
      isPending={isPending}
      tone="danger"
      title="Revogar autorização?"
      confirmLabel="Revogar"
      pendingLabel="Revogando..."
    >
      <div className="space-y-4">
        <p>
          A revogação é definitiva. O registro desta autorização não é apagado e
          continua no histórico do paciente. Para voltar a usar imagens, será
          preciso registrar uma nova autorização.
        </p>

        <Textarea
          label="Motivo"
          hint="Opcional. Não é preciso incluir dados clínicos."
          rows={3}
          maxLength={500}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          disabled={isPending}
        />
      </div>
    </ConfirmDialog>
  );
}
