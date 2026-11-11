import { consentPagePath } from "@/lib/consents";
import type { ReactNode } from "react";
import { FaExternalLinkAlt } from "react-icons/fa";

interface Props {
  patientId: string;
  children: ReactNode;
  className?: string;
}

export default function ConsentPageLink({
  patientId,
  children,
  className = "",
}: Props) {
  return (
    <a
      href={consentPagePath(patientId)}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 underline underline-offset-2 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${className}`}
    >
      {children}{" "}
      <FaExternalLinkAlt aria-hidden className="text-[0.7em]" />
      <span className="sr-only">(abre em nova aba)</span>
    </a>
  );
}
