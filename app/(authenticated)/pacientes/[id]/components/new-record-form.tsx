"use client";

import Button from "@/app/ui/button";
import Textarea from "@/app/ui/textarea";
import { useCreateRecord } from "@/hooks/records/useCreateRecord";
import { applyFieldErrors } from "@/lib/form-errors";
import { RECORD_CONTENT_MAX_LENGTH } from "@/model/record";
import type { Patient } from "@/model/patient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import z from "zod";

interface Props {
  patient: Patient;
}

const maxLengthLabel = RECORD_CONTENT_MAX_LENGTH.toLocaleString("pt-BR");

const schema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Escreva o texto do registro")
    .max(
      RECORD_CONTENT_MAX_LENGTH,
      `O registro deve ter no máximo ${maxLengthLabel} caracteres`,
    ),
});

type RecordFormValues = z.infer<typeof schema>;

const formFields = ["content"] as const;

export default function NewRecordForm({ patient }: Props) {
  const [savedCount, setSavedCount] = useState(0);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    setFocus,
    formState: { errors },
  } = useForm<RecordFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { content: "" },
  });

  const { createRecord, isPending } = useCreateRecord(patient.id, {
    onDone: () => {
      reset();
      setSavedCount((count) => count + 1);
    },
    onValidationError: (err) => applyFieldErrors(err, setError, formFields),
  });

  useEffect(() => {
    if (savedCount > 0) {
      setFocus("content");
    }
  }, [savedCount, setFocus]);

  const content = useWatch({ control, name: "content" });
  const length = content.trim().length;
  const isArchived = Boolean(patient.archivedAt);

  if (isArchived && !content) {
    return null;
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit((values) => createRecord(values))}
      className="mt-5"
    >
      <Textarea
        label="Novo registro"
        rows={5}
        readOnly={isArchived}
        hint={`${length.toLocaleString("pt-BR")} de ${maxLengthLabel} caracteres. A autoria, a data e a hora são registradas automaticamente.`}
        error={errors.content?.message}
        {...register("content")}
      />

      {isArchived && (
        <p role="alert" className="mt-3 text-sm text-warning-400">
          O paciente foi arquivado e este texto ainda não foi salvo. Reative o
          paciente para salvar ou copie o texto antes de sair da página.
        </p>
      )}

      <div className="mt-4 flex justify-end">
        <Button block={false} disabled={isPending || isArchived}>
          {isPending ? "Salvando..." : "Salvar registro"}
        </Button>
      </div>
    </form>
  );
}
