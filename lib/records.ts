import type { RecordVoidReason } from "@/model/record";

export const voidReasonLabels: Record<RecordVoidReason, string> = {
  wrong_patient: "Registrado no paciente errado",
  duplicate: "Registro duplicado",
  other: "Outro motivo",
};
