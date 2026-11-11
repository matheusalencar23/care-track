"use client";

import Button from "@/app/ui/button";
import Input from "@/app/ui/input";
import Modal from "@/app/ui/modal";
import RadioGroup from "@/app/ui/radio-group";
import { useGrantConsent } from "@/hooks/consents/useGrantConsent";
import {
  formatDate,
  isBeforeBirth,
  isMinorAt,
  toLocalDateTimeInput,
} from "@/lib/dates";
import { applyFieldErrors } from "@/lib/form-errors";
import {
  CONSENT_GRANTORS,
  CONSENT_METHODS,
  type GrantConsentData,
} from "@/model/consent";
import type { Patient } from "@/model/patient";
import { hasErrorCode } from "@/shared/ApiError";
import { zodResolver } from "@hookform/resolvers/zod";
import { useId, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import z from "zod";

interface Props {
  patient: Patient;
  open: boolean;
  onClose: () => void;
  isRenewal?: boolean;
}

const RENEWAL_DATE_MESSAGE =
  "A nova autorização precisa ter sido coletada depois que o paciente completou 18 anos.";

const MINOR_MESSAGE =
  "O paciente era menor de idade na data da coleta: a autorização deve ser dada pelo responsável legal.";

function beforeBirthMessage(birthDate: string) {
  return `A data da coleta não pode ser anterior ao nascimento do paciente (${formatDate(birthDate)}).`;
}

function parseCollectedAt(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function createSchema(birthDate: string, isRenewal: boolean) {
  return z
    .object({
      method: z.enum(CONSENT_METHODS, "Informe a forma da coleta"),
      grantor: z.enum(CONSENT_GRANTORS, "Informe quem autorizou"),
      representativeName: z
        .string()
        .trim()
        .max(
          200,
          "O nome do responsável legal deve ter no máximo 200 caracteres",
        ),
      collectedAt: z
        .string()
        .min(1, "Informe a data e a hora da coleta")
        .refine((value) => parseCollectedAt(value), "Data da coleta inválida")
        .refine(
          (value) => {
            const date = parseCollectedAt(value);

            return !date || date <= new Date();
          },
          "A data da coleta não pode estar no futuro",
        ),
    })
    .superRefine((values, context) => {
      if (
        values.grantor === "legal_representative" &&
        !values.representativeName
      ) {
        context.addIssue({
          code: "custom",
          path: ["representativeName"],
          message: "O nome do responsável legal é obrigatório",
        });
      }

      const collectedAt = parseCollectedAt(values.collectedAt);

      if (collectedAt && isBeforeBirth(birthDate, collectedAt)) {
        context.addIssue({
          code: "custom",
          path: ["collectedAt"],
          message: beforeBirthMessage(birthDate),
        });
        return;
      }

      if (isRenewal && collectedAt && isMinorAt(birthDate, collectedAt)) {
        context.addIssue({
          code: "custom",
          path: ["collectedAt"],
          message: RENEWAL_DATE_MESSAGE,
        });
      }

      if (
        values.grantor === "patient" &&
        collectedAt &&
        isMinorAt(birthDate, collectedAt)
      ) {
        context.addIssue({
          code: "custom",
          path: ["grantor"],
          message: MINOR_MESSAGE,
        });
      }
    });
}

type ConsentFormValues = z.infer<ReturnType<typeof createSchema>>;

const formFields = [
  "method",
  "grantor",
  "representativeName",
  "collectedAt",
] as const;

export default function GrantConsentDialog({
  patient,
  open,
  onClose,
  isRenewal = false,
}: Props) {
  const [startedAsRenewal] = useState(isRenewal);
  const formId = useId();
  const [initialCollectedAt] = useState(() => toLocalDateTimeInput());

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ConsentFormValues>({
    resolver: zodResolver(createSchema(patient.birthDate, startedAsRenewal)),
    defaultValues: {
      grantor: isMinorAt(patient.birthDate, new Date())
        ? "legal_representative"
        : undefined,
      representativeName: "",
      collectedAt: initialCollectedAt,
    },
  });

  const { grantConsent, isPending } = useGrantConsent(patient.id, {
    onDone: onClose,
    isRenewal: startedAsRenewal,
    onFormError: (err) => {
      if (hasErrorCode(err, "CONSENT_REQUIRES_REPRESENTATIVE")) {
        setError("grantor", { type: "server", message: MINOR_MESSAGE });
        return true;
      }

      if (hasErrorCode(err, "CONSENT_COLLECTED_BEFORE_BIRTH")) {
        setError(
          "collectedAt",
          { type: "server", message: beforeBirthMessage(patient.birthDate) },
          { shouldFocus: true },
        );
        return true;
      }

      return (
        hasErrorCode(err, "VALIDATION_FAILED") &&
        applyFieldErrors(err, setError, formFields)
      );
    },
  });

  const grantor = useWatch({ control, name: "grantor" });
  const collectedAt = useWatch({ control, name: "collectedAt" });
  const isMinor = isMinorAt(
    patient.birthDate,
    parseCollectedAt(collectedAt) ?? new Date(),
  );

  function onSubmit(values: ConsentFormValues) {
    const data: GrantConsentData = {
      type: "image_capture",
      method: values.method,
      grantor: values.grantor,
      ...(values.grantor === "legal_representative" && {
        representativeName: values.representativeName,
      }),
      ...(values.collectedAt !== initialCollectedAt && {
        collectedAt: new Date(values.collectedAt).toISOString(),
      }),
    };

    grantConsent(data);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        startedAsRenewal
          ? "Renovar autorização de uso de imagem"
          : "Registrar autorização de uso de imagem"
      }
      dismissible={!isPending}
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            block={false}
            onClick={onClose}
            disabled={isPending}
          >
            Cancelar
          </Button>

          <Button form={formId} block={false} disabled={isPending}>
            {startedAsRenewal
              ? isPending
                ? "Renovando..."
                : "Renovar"
              : isPending
                ? "Registrando..."
                : "Registrar"}
          </Button>
        </>
      }
    >
      <form
        id={formId}
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
      >
        {startedAsRenewal ? (
          <p>
            <strong>{patient.name}</strong> completou 18 anos. Registre a nova
            autorização já coletada. A autorização anterior será revogada e
            continuará no histórico.
          </p>
        ) : (
          <p>
            Registre aqui a autorização já coletada de{" "}
            <strong>{patient.name}</strong> para o uso de fotos e vídeos no
            acompanhamento.
          </p>
        )}

        <Controller
          control={control}
          name="method"
          render={({ field }) => (
            <RadioGroup
              {...field}
              label="Forma da coleta"
              autoFocusFirst
              error={errors.method?.message}
              options={[
                { value: "written", label: "Por escrito" },
                { value: "verbal", label: "Verbal" },
              ]}
            />
          )}
        />

        <Controller
          control={control}
          name="grantor"
          render={({ field }) => (
            <RadioGroup
              {...field}
              label="Quem autorizou"
              hint={isMinor ? MINOR_MESSAGE : undefined}
              error={errors.grantor?.message}
              options={[
                {
                  value: "patient",
                  label: "O próprio paciente",
                  disabled: isMinor,
                },
                {
                  value: "legal_representative",
                  label: "Responsável legal",
                },
              ]}
            />
          )}
        />

        {grantor === "legal_representative" && (
          <Input
            label="Nome do responsável legal"
            autoComplete="off"
            maxLength={200}
            error={errors.representativeName?.message}
            {...register("representativeName")}
          />
        )}

        <Input
          label="Data e hora da coleta"
          type="datetime-local"
          className="scheme-dark"
          min={`${patient.birthDate.slice(0, 10)}T00:00`}
          max={initialCollectedAt}
          hint="Se a coleta foi agora, deixe como está."
          error={errors.collectedAt?.message}
          {...register("collectedAt")}
        />
      </form>
    </Modal>
  );
}
