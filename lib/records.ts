import {
  RECORD_CONTENT_MAX_LENGTH,
  type RecordVoidReason,
} from "@/model/record";
import z from "zod";

export const voidReasonLabels: Record<RecordVoidReason, string> = {
  wrong_patient: "Registrado no paciente errado",
  duplicate: "Registro duplicado",
  other: "Outro motivo",
};

export const recordContentMaxLengthLabel =
  RECORD_CONTENT_MAX_LENGTH.toLocaleString("pt-BR");

export const recordContentSchema = z
  .string()
  .trim()
  .min(1, "Escreva o texto do registro")
  .max(
    RECORD_CONTENT_MAX_LENGTH,
    `O registro deve ter no máximo ${recordContentMaxLengthLabel} caracteres`,
  );

export function recordContentHint(content: string) {
  return `${content.trim().length.toLocaleString("pt-BR")} de ${recordContentMaxLengthLabel} caracteres.`;
}

export const recordOptionalContentSchema = z
  .string()
  .trim()
  .max(
    RECORD_CONTENT_MAX_LENGTH,
    `O registro deve ter no máximo ${recordContentMaxLengthLabel} caracteres`,
  );
