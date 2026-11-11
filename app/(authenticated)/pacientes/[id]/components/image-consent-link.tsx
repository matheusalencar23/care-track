"use client";

import Badge from "@/app/ui/badge";
import LinkButton from "@/app/ui/link-button";
import { useConsents } from "@/hooks/consents/useConsents";
import {
  consentPagePath,
  imageConsentStatus,
  type ImageConsentStatus,
} from "@/lib/consents";
import type { Patient } from "@/model/patient";
import { FaCamera } from "react-icons/fa";

const statusBadges: Record<
  ImageConsentStatus,
  { label: string; tone: "success" | "warning" | "neutral" }
> = {
  active: { label: "Autorizado", tone: "success" },
  renewal: { label: "Renovação necessária", tone: "warning" },
  none: { label: "Sem autorização", tone: "neutral" },
};

export default function ImageConsentLink({ patient }: { patient: Patient }) {
  const { data: consents } = useConsents(patient.id);
  const status = consents
    ? statusBadges[imageConsentStatus(consents, patient.birthDate)]
    : null;

  return (
    <LinkButton
      href={consentPagePath(patient.id)}
      variant="secondary"
      block={false}
    >
      <FaCamera aria-hidden className="text-sm" />
      <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
        Autorização de imagem
        {status && (
          <>
            <span className="sr-only">:</span>{" "}
            <Badge tone={status.tone}>{status.label}</Badge>
          </>
        )}
      </span>
    </LinkButton>
  );
}
